<?php
// "Add your event" form. Saves the raw submission to data/submissions.json in the repo;
// the deploy workflow cleans it up and puts it in the review queue.
require __DIR__ . '/_lib.php';

$b = json_in();
if (!empty($b['website'])) json_out(['message' => 'Thanks!']); // honeypot: bots fill in hidden fields

foreach (['title', 'date', 'town', 'venue'] as $k) {
    if (trim((string)($b[$k] ?? '')) === '') json_out(['error' => "Please fill in: $k"], 400);
}
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$b['date'])) json_out(['error' => 'Please use a real date.'], 400);
if (strtotime((string)$b['date'] . ' 23:59') < time() - 86400) json_out(['error' => "That date looks like it's already passed."], 400);
foreach (['time', 'endTime'] as $k) {
    if (!empty($b[$k]) && !preg_match('/^\d{2}:\d{2}$/', (string)$b[$k])) json_out(['error' => 'Please use a real time.'], 400);
}
$url = trim((string)($b['url'] ?? ''));
if ($url !== '' && !preg_match('#^https?://#i', $url)) $url = '';

// Simple rate limit: 5 submissions per IP per hour.
$bucket = sys_get_temp_dir() . '/na_submit_' . md5((string)($_SERVER['REMOTE_ADDR'] ?? '')) . '_' . date('YmdH');
$count = (int)@file_get_contents($bucket);
if ($count >= 5) json_out(['error' => 'Thanks! That is plenty for now. Please try again later.'], 429);
@file_put_contents($bucket, (string)($count + 1));

if (cfg('github_token') === '') json_out(['error' => 'Submissions open very soon. Please check back in a few days.'], 503);

$item = [
    'title' => clean($b['title'] ?? '', 140),
    'date' => (string)$b['date'],
    'time' => (string)($b['time'] ?? ''),
    'endTime' => (string)($b['endTime'] ?? ''),
    'town' => clean($b['town'] ?? '', 40),
    'venue' => clean($b['venue'] ?? '', 120),
    'address' => clean($b['address'] ?? '', 200),
    'description' => clean($b['description'] ?? '', 2000),
    'url' => $url,
    'price' => clean($b['price'] ?? '', 60),
    'category' => clean($b['category'] ?? '', 20),
    'name' => clean($b['name'] ?? '', 80),
    'org' => clean($b['org'] ?? '', 120),
    'receivedAt' => gmdate('c'),
];

try {
    gh_append('data/submissions.json', $item, 'Event submitted: ' . $item['title']);
} catch (Throwable $e) {
    error_log('Submit failed: ' . $e->getMessage());
    json_out(['error' => "Couldn't save that just now. Please try again."], 502);
}
json_out(['message' => "Thanks! We'll take a quick look and it should be live within a day or two."]);
