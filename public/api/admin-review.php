<?php
// Saves approve / remove / trust choices. The deploy workflow applies them and republishes the site.
require __DIR__ . '/_lib.php';
require_admin();

$b = json_in();
$ids = fn($v) => array_values(array_filter(array_map('strval', is_array($v) ? $v : []), fn($s) => preg_match('/^[a-z0-9_-]{1,64}$/i', $s)));
$batch = ['approve' => $ids($b['approve'] ?? []), 'reject' => $ids($b['reject'] ?? []), 'trustSources' => $ids($b['trustSources'] ?? []), 'at' => gmdate('c')];
if (!$batch['approve'] && !$batch['reject'] && !$batch['trustSources']) json_out(['ok' => true]);

try {
    gh_append('data/pending-decisions.json', $batch, sprintf('Review: %d approved, %d removed', count($batch['approve']), count($batch['reject'])));
} catch (Throwable $e) {
    json_out(['error' => $e->getMessage()], 502);
}
json_out(['ok' => true]);
