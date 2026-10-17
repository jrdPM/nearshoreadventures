<?php
require __DIR__ . '/_lib.php';
require_admin();
if (cfg('github_token') === '') json_out(['error' => 'Add SITE_GITHUB_TOKEN to the GitHub secrets so this page can read the queue.'], 503);

try {
    [$queue] = gh_read('data/review-queue.json', []);
    [$subs] = gh_read('data/submissions.json', []);
    [$pending] = gh_read('data/pending-decisions.json', []);
    [$report] = gh_read('data/scrape-report.json', null);
    [$sources] = gh_read('data/sources.json', []);
} catch (Throwable $e) {
    json_out(['error' => $e->getMessage()], 502);
}

// Hide anything already decided but not yet applied by the next deploy.
$done = [];
$trusted = [];
foreach ($pending as $p) {
    foreach (array_merge($p['approve'] ?? [], $p['reject'] ?? []) as $id) $done[$id] = true;
    foreach ($p['trustSources'] ?? [] as $sid) $trusted[$sid] = true;
}
$queue = array_values(array_filter($queue, fn($q) => empty($done[$q['event']['id']]) && empty($trusted[$q['event']['source']['id']])));

json_out(['queue' => $queue, 'report' => $report, 'sources' => $sources, 'incoming' => count($subs)]);
