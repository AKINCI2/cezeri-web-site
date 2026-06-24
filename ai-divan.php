<?php
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/config.php';

if (!$GEMINI_API_KEY || $GEMINI_API_KEY === 'BURAYA_GEMINI_API_KEY_YAZ') {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Gemini API anahtarı config.php içinde tanımlı değil.'], JSON_UNESCAPED_UNICODE);
  exit;
}
if (!function_exists('curl_init')) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'PHP cURL kapalı.'], JSON_UNESCAPED_UNICODE);
  exit;
}

$payload = [
  'contents' => [[
    'role' => 'user',
    'parts' => [['text' => 'Sadece OK yaz.']]
  ]],
  'generationConfig' => [
    'maxOutputTokens' => 20,
    'temperature' => 0
  ]
];

$url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($GEMINI_MODEL) . ':generateContent';
$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Content-Type: application/json',
    'x-goog-api-key: ' . $GEMINI_API_KEY
  ],
  CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
  CURLOPT_TIMEOUT => 30
]);
$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

$out = ['ok' => false, 'http_code' => $httpCode, 'model' => $GEMINI_MODEL];
if ($result === false) {
  $out['error'] = $error ?: 'cURL isteği başarısız.';
} else {
  $data = json_decode($result, true);
  if ($httpCode >= 200 && $httpCode < 300) {
    $out['ok'] = true;
    $out['message'] = 'Gemini bağlantısı başarılı.';
    $out['reply'] = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
  } else {
    $out['error'] = $data['error']['message'] ?? ('HTTP ' . $httpCode);
    $out['status'] = $data['error']['status'] ?? null;
    $out['code'] = $data['error']['code'] ?? null;
  }
}

echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>
