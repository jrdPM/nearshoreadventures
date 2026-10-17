<?php
// Shared helpers for the PHP endpoints that run on Cloudways.
// _config.php is written by the deploy workflow from GitHub secrets and is never committed.

declare(strict_types=1);

function config(): array {
    static $cfg = null;
    if ($cfg === null) {
        $file = __DIR__ . '/_config.php';
        $cfg = is_file($file) ? (require $file) : [];
    }
    return $cfg;
}

function cfg(string $key): string {
    return (string)(config()[$key] ?? '');
}

function json_out(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json');
    header('Cache-Control: no-store');
    echo json_encode($data);
    exit;
}

function json_in(): array {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_out(['error' => 'POST only'], 405);
    $raw = file_get_contents('php://input') ?: '';
    if (strlen($raw) > 20000) json_out(['error' => 'Too much data'], 413);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function http(string $method, string $url, array $headers, ?string $body = null): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => $headers,
    ]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    $resp = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$status, is_string($resp) ? $resp : ''];
}

// ---------- GitHub: the site's data lives in the repo ----------

function gh_headers(string $accept = 'application/vnd.github+json'): array {
    return [
        'Authorization: Bearer ' . cfg('github_token'),
        'Accept: ' . $accept,
        'X-GitHub-Api-Version: 2022-11-28',
        'User-Agent: nearshore-adventures',
        'Content-Type: application/json',
    ];
}

function gh_url(string $path): string {
    $repo = cfg('github_repo') ?: 'jrdPM/nearshoreadventures';
    return "https://api.github.com/repos/{$repo}/contents/{$path}?ref=" . rawurlencode(cfg('github_branch') ?: 'main');
}

/** Returns [decoded json, sha] for a file in the repo. */
function gh_read(string $path, $fallback = []): array {
    [$status, $body] = http('GET', gh_url($path), gh_headers());
    if ($status === 404) return [$fallback, null];
    if ($status !== 200) throw new RuntimeException("GitHub read failed ($status)");
    $meta = json_decode($body, true);
    if (!empty($meta['content'])) {
        $content = base64_decode((string)$meta['content']);
    } else {
        // Files over 1MB: fetch the raw bytes instead.
        [$s2, $content] = http('GET', gh_url($path), gh_headers('application/vnd.github.raw+json'));
        if ($s2 !== 200) throw new RuntimeException("GitHub raw read failed ($s2)");
    }
    return [json_decode($content, true) ?? $fallback, $meta['sha'] ?? null];
}

/** Append one item to a JSON array file in the repo, retrying if someone else wrote first. */
function gh_append(string $path, array $item, string $message): void {
    for ($attempt = 0; $attempt < 4; $attempt++) {
        [$list, $sha] = gh_read($path, []);
        if (!is_array($list)) $list = [];
        $list[] = $item;
        $payload = [
            'message' => $message,
            'content' => base64_encode(json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n"),
            'branch' => cfg('github_branch') ?: 'main',
        ];
        if ($sha) $payload['sha'] = $sha;
        $repo = cfg('github_repo') ?: 'jrdPM/nearshoreadventures';
        [$status] = http('PUT', "https://api.github.com/repos/{$repo}/contents/{$path}", gh_headers(), json_encode($payload));
        if ($status === 200 || $status === 201) return;
        if ($status !== 409 && $status !== 422) throw new RuntimeException("GitHub write failed ($status)");
        usleep(400000);
    }
    throw new RuntimeException('GitHub write kept conflicting');
}

function clean(?string $s, int $max): string {
    return mb_substr(trim(strip_tags((string)$s)), 0, $max);
}

// ---------- Admin session ----------

function admin_session(): void {
    session_name('na_admin');
    session_set_cookie_params(['lifetime' => 60 * 60 * 24 * 30, 'path' => '/', 'secure' => !empty($_SERVER['HTTPS']), 'httponly' => true, 'samesite' => 'Strict']);
    session_start();
}

function require_admin(): void {
    admin_session();
    if (empty($_SESSION['admin']) || cfg('admin_password') === '') json_out(['error' => 'Not signed in'], 401);
}
