<?php
require __DIR__ . '/_lib.php';

$b = json_in();
$real = trim(cfg('admin_password'));
if ($real === '') json_out(['error' => 'Add ADMIN_PASSWORD to the GitHub secrets and redeploy first.'], 503);

usleep(300000); // slow down guessing
if (!hash_equals($real, trim((string)($b['password'] ?? '')))) json_out(['error' => 'Wrong password.'], 401);

admin_sign_in();
json_out(['ok' => true]);
