<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Sadece POST isteği kabul edilir.'], JSON_UNESCAPED_UNICODE);
  exit;
}

require __DIR__ . '/config.php';

if (!$GEMINI_API_KEY || $GEMINI_API_KEY === 'BURAYA_GEMINI_API_KEY_YAZ') {
  http_response_code(500);
  echo json_encode(['error' => 'Gemini API anahtarı tanımlı değil. api/config.php dosyasını düzenle.'], JSON_UNESCAPED_UNICODE);
  exit;
}

if (!function_exists('curl_init')) {
  http_response_code(500);
  echo json_encode(['error' => 'Sunucuda PHP cURL kapalı. cPanel > PHP Extensions bölümünden curl uzantısını aç.'], JSON_UNESCAPED_UNICODE);
  exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
$project = trim($body['project'] ?? '');

if (mb_strlen($project) < 8) {
  http_response_code(400);
  echo json_encode(['error' => 'Lütfen daha açıklayıcı bir proje talebi yaz.'], JSON_UNESCAPED_UNICODE);
  exit;
}

if (mb_strlen($project) > 1500) {
  $project = mb_substr($project, 0, 1500);
}

$schemaInstruction = <<<TXT
Sen Cezeri Digital'in yaşayan dijital şirket sistemi olan "Cezeri Divanı" için çalışıyorsun.
Kullanıcı bir müşteri talebi yazacak. Sen 5 karakterin ayrı görüşünü ve final kararını üreteceksin.
Türkçe yaz. Kısa, net, satış odaklı, profesyonel ama sıcak ol. Her metin kısa kalsın; toplam çıktı asla uzun olmasın.
Kesin fiyat verme; "tahmini paket", "net fiyat için görüşme" gibi ifade kullan.
Cevabın SADECE geçerli JSON olsun. Markdown yok.
JSON formatı:
{
  "responses": [
    {"key":"cezeri", "title":"⚙️ Cezeri - Baş Mühendis", "text":"..."},
    {"key":"mimar", "title":"🎨 Mimar Sinan - Tasarım Direktörü", "text":"..."},
    {"key":"farabi", "title":"💻 Farabi - Yazılım Mimarı", "text":"..."},
    {"key":"tonyukuk", "title":"📢 Tonyukuk - Pazarlama Uzmanı", "text":"..."},
    {"key":"vedat", "title":"👑 Vedat Barut - Kurucu", "text":"..."}
  ],
  "final": "📜 Divan kararı metni..."
}
Kurallar:
- Her karakter en fazla 1 kısa cümle yazsın; final en fazla 2 kısa cümle olsun.
- Cezeri teknik/stratejik çerçeve kurar.
- Mimar Sinan tasarım, renk, görsel kalite konuşur.
- Farabi yazılım, altyapı, entegrasyon konuşur.
- Tonyukuk pazarlama, SEO, sosyal medya, müşteri kazanımı konuşur.
- Vedat Barut kurucu olarak karar verir, güven verir, sonraki adımı söyler.
TXT;

$payload = [
  'systemInstruction' => [
    'parts' => [
      ['text' => $schemaInstruction]
    ]
  ],
  'contents' => [
    [
      'role' => 'user',
      'parts' => [
        ['text' => 'Müşteri talebi: ' . $project]
      ]
    ]
  ],
  'generationConfig' => [
    'temperature' => 0.35,
    'maxOutputTokens' => 2048,
    'responseMimeType' => 'application/json',
    'responseSchema' => [
      'type' => 'OBJECT',
      'properties' => [
        'responses' => [
          'type' => 'ARRAY',
          'items' => [
            'type' => 'OBJECT',
            'properties' => [
              'key' => ['type'=>'STRING'],
              'title' => ['type'=>'STRING'],
              'text' => ['type'=>'STRING']
            ],
            'required' => ['key','title','text']
          ]
        ],
        'final' => ['type'=>'STRING']
      ],
      'required' => ['responses','final']
    ]
  ]
];

$primaryModel = (strpos($GEMINI_MODEL, '3.5') !== false) ? 'gemini-2.5-flash' : $GEMINI_MODEL;
$modelsToTry = array_values(array_unique(array_filter([
  $primaryModel,
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash'
])));

$result = false;
$httpCode = 0;
$error = '';
$usedModel = $GEMINI_MODEL;
$lastDetail = '';

foreach ($modelsToTry as $modelName) {
  $usedModel = $modelName;
  $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($modelName) . ':generateContent';
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
      'Content-Type: application/json',
      'x-goog-api-key: ' . $GEMINI_API_KEY
    ],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
    CURLOPT_TIMEOUT => 45
  ]);
  $result = curl_exec($ch);
  $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $error = curl_error($ch);
  curl_close($ch);

  if ($result !== false && $httpCode < 400) {
    break;
  }

  $safeDetail = $error ?: 'HTTP ' . $httpCode;
  $errData = json_decode($result ?: '', true);
  if (isset($errData['error']['message'])) {
    $safeDetail .= ' - ' . $errData['error']['message'];
  }
  $lastDetail = $safeDetail . ' (model: ' . $modelName . ')';

  // 503 yoğunluk veya 429 kota durumunda diğer modele geçmeyi dene.
  if (!in_array($httpCode, [429, 503, 500, 502, 504])) {
    break;
  }
}

if ($result === false || $httpCode >= 400) {
  http_response_code(502);
  echo json_encode([
    'error' => 'Gemini AI servisinden cevap alınamadı.',
    'detail' => $lastDetail ?: ($error ?: 'HTTP ' . $httpCode)
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

$data = json_decode($result, true);
$text = '';
if (isset($data['candidates'][0]['content']['parts'])) {
  foreach ($data['candidates'][0]['content']['parts'] as $part) {
    if (isset($part['text'])) $text .= $part['text'];
  }
}

$text = trim($text);
$text = preg_replace('/^```json\s*/i', '', $text);
$text = preg_replace('/^```\s*/', '', $text);
$text = preg_replace('/\s*```$/', '', $text);

$decoded = json_decode($text, true);
if (!$decoded) {
  if (preg_match('/\{.*\}/s', $text, $m)) {
    $decoded = json_decode($m[0], true);
  }
}
if (!$decoded || !isset($decoded['responses']) || !isset($decoded['final'])) {
  http_response_code(502);
  echo json_encode([
    'error' => 'Gemini cevabı beklenen JSON formatında değil.',
    'detail' => mb_substr($text ?: $result, 0, 500)
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

$decoded['_model'] = $usedModel;
echo json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>
