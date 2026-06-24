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

$configPath = '/home/cezeridi/private/telegram-config.php';
$logPath = '/home/cezeridi/private/telegram-lead-log.jsonl';

if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'config_missing', 'message' => 'telegram-config.php bulunamadi']);
    exit;
}

$config = require $configPath;
$botToken = trim($config['bot_token'] ?? '');
$chatIds = $config['chat_ids'] ?? [];

if ($botToken === '' || empty($chatIds) || !is_array($chatIds)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'config_incomplete', 'message' => 'bot_token veya chat_ids eksik']);
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

function api_error_text($response, $fallback = '') {
    if (is_array($response) && isset($response['description'])) {
        return (string)$response['description'];
    }
    return $fallback ?: 'Bildirim API hatasi';
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

$message = mb_substr($message, 0, 3900, 'UTF-8');
$url = 'https://api.telegram.org/bot' . rawurlencode($botToken) . '/sendMessage';
$results = [];

foreach ($chatIds as $chatId) {
    $chatId = trim((string)$chatId);
    if ($chatId === '') continue;

    $payload = [
        'chat_id' => $chatId,
        'text' => $message,
        'disable_web_page_preview' => true
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 20
    ]);

    $responseText = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    $decoded = json_decode($responseText, true);
    $ok = $httpCode >= 200 && $httpCode < 300 && is_array($decoded) && !empty($decoded['ok']);
    $results[] = [
        'chat_id' => $chatId,
        'http_code' => $httpCode,
        'ok' => $ok,
        'error' => $ok ? '' : api_error_text($decoded, $curlError),
        'response' => $decoded ?: $responseText
    ];
}

$successCount = count(array_filter($results, fn($r) => $r['ok']));
$totalCount = count($results);
$failures = array_values(array_filter($results, fn($r) => !$r['ok']));
$firstError = !empty($failures) ? ($failures[0]['chat_id'] . ': ' . $failures[0]['error']) : '';

$logData = [
    'time' => date('c'),
    'name' => $name,
    'phone' => $phone,
    'services' => $services,
    'success_count' => $successCount,
    'total_count' => $totalCount,
    'first_error' => $firstError,
    'results' => $results
];
@file_put_contents($logPath, json_encode($logData, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND);

if ($successCount > 0) {
    http_response_code(200);
    echo json_encode([
        'ok' => true,
        'partial' => $successCount < $totalCount,
        'sent' => $successCount,
        'total' => $totalCount,
        'message' => $successCount < $totalCount ? "{$successCount}/{$totalCount} kisiye iletildi" : 'Talep ekibe iletildi',
        'first_error' => $firstError
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(502);
echo json_encode([
    'ok' => false,
    'error' => 'team_notification_failed',
    'sent' => 0,
    'total' => $totalCount,
    'message' => $firstError ?: 'Ekip bildirimi basarisiz',
    'first_error' => $firstError
], JSON_UNESCAPED_UNICODE);
