<?php
// Adds a newsletter subscriber to Beehiiv.
require __DIR__ . '/_lib.php';

$body = json_in();
$email = trim((string)($body['email'] ?? ''));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_out(['error' => "That email doesn't look right."], 400);

$key = cfg('beehiiv_api_key');
$pub = cfg('beehiiv_publication_id');
if ($key === '' || $pub === '') json_out(['error' => "We're still setting up the email. Check back in a few days!"], 503);

[$status, $resp] = http('POST', "https://api.beehiiv.com/v2/publications/{$pub}/subscriptions", [
    "Authorization: Bearer {$key}",
    'Content-Type: application/json',
], json_encode([
    'email' => $email,
    'reactivate_existing' => true,
    'send_welcome_email' => true,
    'utm_source' => 'website',
    'referring_site' => 'nearshoreadventures.com',
]));

if ($status < 200 || $status >= 300) {
    error_log("Beehiiv subscribe failed: $status $resp");
    json_out(['error' => "Couldn't sign you up just now. Please try again."], 502);
}
json_out(['message' => "You're in! Look for us Thursday morning."]);
