<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

$configPath = '/home/cezeridi/private/whatsapp-config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'config_missing']);
    exit;
}

$config = require $configPath;
$token = trim($config['token'] ?? '');
$phoneNumberId = trim($config['phone_number_id'] ?? '');
$recipients = $config['recipients'] ?? [];

if ($token === '' || $phoneNumberId === '' || empty($recipients)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'config_incomplete']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_json']);
    exit;
}

function clean_text($value) {
    $value = is_scalar($value) ? (string)$value : '';
    $value = trim(strip_tags($value));
    return mb_substr($value, 0, 1800, 'UTF-8');
}

$name = clean_text($input['name'] ?? 'Belirtilmedi');
$phone = clean_text($input['phone'] ?? 'Belirtilmedi');
$services = $input['services'] ?? [];
if (is_array($services)) {
    $services = implode(', ', array_map('clean_text', $services));
} else {
    $services = clean_text($services);
}
$detail = clean_text($input['detail'] ?? 'Belirtilmedi');
$deadline = clean_text($input['deadline'] ?? 'Belirtilmedi');
$budget = clean_text($input['budget'] ?? 'Belirtilmedi');
$decision = clean_text($input['decision'] ?? 'Divan kararı henüz yok');

$message = "CEZERI DIGITAL YENI TALEP\n\n" .
    "Ad Soyad: {$name}\n" .
    "Telefon: {$phone}\n" .
    "Hizmet Turu: {$services}\n\n" .
    "Musteri Ne Istiyor:\n{$detail}\n\n" .
    "Istenen Sure: {$deadline}\n" .
    "Butce / Ek Not: {$budget}\n\n" .
    "AI Divani Karari:\n{$decision}\n\n" .
    "Kaynak: cezeridigital.com";

$url = "https://graph.facebook.com/v25.0/{$phoneNumberId}/messages";
$results = [];

foreach ($recipients as $recipient) {
    $recipient = preg_replace('/\D+/', '', (string)$recipient);
    if ($recipient === '') continue;

    $payload = [
        'messaging_product' => 'whatsapp',
        'to' => $recipient,
        'type' => 'text',
        'text' => ['preview_url' => false, 'body' => $message]
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 20
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    $results[] = [
        'recipient' => $recipient,
        'http_code' => $httpCode,
        'ok' => $httpCode >= 200 && $httpCode < 300,
        'error' => $curlError,
        'response' => json_decode($response, true) ?: $response
    ];
}

$allOk = !empty($results) && count(array_filter($results, fn($r) => !$r['ok'])) === 0;
http_response_code($allOk ? 200 : 502);
echo json_encode(['ok' => $allOk, 'results' => $results], JSON_UNESCAPED_UNICODE);
