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

function clean_text($value, $limit = 1600) {
    $value = is_scalar($value) ? (string)$value : '';
    $value = trim(strip_tags($value));
    return mb_substr($value, 0, $limit, 'UTF-8');
}

function list_text($value) {
    if (is_array($value)) {
        $items = array_filter(array_map(fn($v) => clean_text($v, 120), $value));
        return $items ? implode(', ', $items) : 'Belirtilmedi';
    }
    $text = clean_text($value, 400);
    return $text !== '' ? $text : 'Belirtilmedi';
}

function api_error_text($response, $fallback = '') {
    if (is_array($response) && isset($response['description'])) {
        return (string)$response['description'];
    }
    return $fallback ?: 'Bildirim API hatasi';
}

$name = clean_text($input['name'] ?? 'Belirtilmedi', 160);
$phone = clean_text($input['phone'] ?? 'Belirtilmedi', 80);
$businessName = clean_text($input['businessName'] ?? 'Belirtilmedi', 180);
$sector = clean_text($input['sector'] ?? 'Belirtilmedi', 180);
$region = clean_text($input['region'] ?? 'Belirtilmedi', 180);
$targetAudience = clean_text($input['targetAudience'] ?? 'Belirtilmedi', 500);
$services = list_text($input['services'] ?? []);
$detail = clean_text($input['detail'] ?? 'Belirtilmedi', 1800);
$designStyle = clean_text($input['designStyle'] ?? 'Belirtilmedi', 220);
$colorPreference = clean_text($input['colorPreference'] ?? 'Belirtilmedi', 220);
$logoStatus = clean_text($input['logoStatus'] ?? 'Belirtilmedi', 220);
$materialStatus = clean_text($input['materialStatus'] ?? 'Belirtilmedi', 260);
$exampleLink = clean_text($input['exampleLink'] ?? 'Belirtilmedi', 420);
$deadline = clean_text($input['deadline'] ?? 'Belirtilmedi', 180);
$budget = clean_text($input['budget'] ?? 'Belirtilmedi', 260);
$priority = clean_text($input['priority'] ?? 'Belirtilmedi', 220);
$reachTime = clean_text($input['reachTime'] ?? 'Belirtilmedi', 220);
$contactNote = clean_text($input['contactNote'] ?? 'Belirtilmedi', 420);
$decision = clean_text($input['decision'] ?? 'Divan kararı henüz yok', 1800);
$customerSummary = clean_text($input['customerSummary'] ?? '', 1200);
$teamBrief = clean_text($input['teamBrief'] ?? '', 1800);
$projectFile = is_array($input['projectFile'] ?? null) ? $input['projectFile'] : [];

$projectType = clean_text($projectFile['projectType'] ?? 'Belirtilmedi', 180);
$recommendedPackage = clean_text($projectFile['recommendedPackage'] ?? 'Belirtilmedi', 180);
$scope = list_text($projectFile['scope'] ?? []);
$stages = list_text($projectFile['stages'] ?? []);
$missingInfo = list_text($projectFile['missingInfo'] ?? []);
$risks = list_text($projectFile['risks'] ?? []);
$nextStep = clean_text($projectFile['nextStep'] ?? 'Belirtilmedi', 600);

$message = "CEZERI DIGITAL - YENI PROJE TALEBI\n\n" .
    "MUSTERI BILGILERI\n" .
    "Ad Soyad: {$name}\n" .
    "Telefon: {$phone}\n" .
    "Ulasmak Icin Uygun Zaman: {$reachTime}\n" .
    "Iletisim Notu: {$contactNote}\n\n" .
    "ISLETME / PROJE\n" .
    "Marka / Isletme: {$businessName}\n" .
    "Sektor: {$sector}\n" .
    "Bolge: {$region}\n" .
    "Hedef Kitle: {$targetAudience}\n" .
    "Hizmetler: {$services}\n\n" .
    "TALEP DETAYI\n{$detail}\n\n" .
    "TASARIM VE ICERIK\n" .
    "Tasarim Tarzi: {$designStyle}\n" .
    "Renk Tercihi: {$colorPreference}\n" .
    "Logo Durumu: {$logoStatus}\n" .
    "Materyal Durumu: {$materialStatus}\n" .
    "Ornek / Link: {$exampleLink}\n\n" .
    "SURE / BUTCE / ONCELIK\n" .
    "Teslim Suresi: {$deadline}\n" .
    "Butce / Not: {$budget}\n" .
    "Oncelik: {$priority}\n\n" .
    "AI PROJE ANALIZI\n" .
    "Proje Tipi: {$projectType}\n" .
    "Onerilen Paket: {$recommendedPackage}\n" .
    "Kapsam: {$scope}\n" .
    "Teslim Asamalari: {$stages}\n" .
    "Eksik Bilgiler: {$missingInfo}\n" .
    "Risk / Varsayim: {$risks}\n" .
    "Sonraki Adim: {$nextStep}\n\n" .
    ($customerSummary ? "MUSTERIYE OZET\n{$customerSummary}\n\n" : '') .
    ($teamBrief ? "EKIP BRIFI\n{$teamBrief}\n\n" : '') .
    "DIVAN KARARI\n{$decision}\n\n" .
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
    'business_name' => $businessName,
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
