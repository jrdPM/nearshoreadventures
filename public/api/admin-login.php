<?php
require __DIR__ . '/_lib.php';

$b = json_in();
$real = cfg('admin_password');
if ($real === '') json_out(['error' => 'Add ADMIN_PASSWORD to the GitHub secrets and redeploy first.'], 503);

usleep(300000); // slow down guessing
if (!hash_equals($real, (string)($b['password'] ?? ''))) json_out(['error' => 'Wrong password.'], 401);

admin_session();
session_regenerate_id(true);
$_SESSION['admin'] = true;
json_out(['ok' => true]);
