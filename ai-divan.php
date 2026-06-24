<?php
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/config.php';

if (!$GEMINI_API_KEY || $GEMINI_API_KEY === 'BURAYA_GEMINI_API_KEY_YAZ') {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Gemini API anahtari config.php icinde tanimli degil.'], JSON_UNESCAPED_UNICODE);
  exit;
}
if (!function_exists('curl_init')) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'PHP cURL kapali.'], JSON_UNESCAPED_UNICODE);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$project = trim((string)($input['project'] ?? ''));
if (mb_strlen($project, 'UTF-8') < 8) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Proje detayi eksik.'], JSON_UNESCAPED_UNICODE);
  exit;
}
$project = mb_substr($project, 0, 7000, 'UTF-8');

$prompt = <<<PROMPT
Cezeri Digital icin profesyonel AI Proje Divani gibi davran. Amacin musteri talebini analiz edip uygulanabilir proje dosyasi, musteri ozeti ve ekip brifi cikarmak.

Kurallar:
- Sadece gecerli JSON dondur.
- Vedat Barut adini kullanma. Son karar karakteri "Cezeri Kurulu - Son Karar" olsun.
- Genel konusma yapma; somut kapsam, eksik bilgi, risk, paket ve aksiyon yaz.
- Fiyat verme; paket seviyesi oner.
- Turkce yaz.

JSON semasi:
{
  "responses":[
    {"key":"cezeri","title":"Cezeri - Strateji ve Kapsam","text":"..."},
    {"key":"mimar","title":"Mimar Sinan - Tasarim ve Marka Dili","text":"..."},
    {"key":"farabi","title":"Farabi - Teknik Plan","text":"..."},
    {"key":"tonyukuk","title":"Tonyukuk - Pazarlama ve Donusum","text":"..."},
    {"key":"vedat","title":"Cezeri Kurulu - Son Karar","text":"..."}
  ],
  "customerSummary":"Musteriye gosterilecek sade ozet.",
  "teamBrief":"Ekibe gidecek detayli is brifi.",
  "projectFile":{
    "projectType":"...",
    "recommendedPackage":"...",
    "budgetLevel":"...",
    "urgency":"...",
    "scope":["..."],
    "stages":["..."],
    "missingInfo":["..."],
    "risks":["..."],
    "upsellOpportunities":["..."],
    "nextStep":"..."
  },
  "final":"Baslikli proje dosyasi: Proje Ozeti, Onerilen Paket, Kapsam, Teslim Asamalari, Eksik Bilgiler, Ekip Notu, Musteriye Sonraki Adim."
}

Rol dagilimi:
Cezeri kapsam ve oncelik; Mimar tasarim ve marka dili; Farabi teknik plan; Tonyukuk pazarlama ve donusum; Cezeri Kurulu uygulanabilir son karar.

Paketler: Acil MVP Web Paketi, Ekonomik Baslangic Paketi, Profesyonel Web Vitrini Paketi, Premium Marka Vitrini Paketi, Marka Kurulum Paketi, Icerik Uretim Paketi.

Musteri talebi:
$project
PROMPT;

$payload = [
  'contents' => [[
    'role' => 'user',
    'parts' => [['text' => $prompt]]
  ]],
  'generationConfig' => [
    'maxOutputTokens' => 2200,
    'temperature' => 0.32,
    'responseMimeType' => 'application/json'
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
  CURLOPT_TIMEOUT => 50
]);
$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($result === false) {
  http_response_code(502);
  echo json_encode(['ok' => false, 'error' => $error ?: 'Gemini istegi basarisiz.'], JSON_UNESCAPED_UNICODE);
  exit;
}
$data = json_decode($result, true);
if ($httpCode < 200 || $httpCode >= 300) {
  http_response_code(502);
  echo json_encode(['ok' => false, 'error' => $data['error']['message'] ?? ('Gemini HTTP ' . $httpCode)], JSON_UNESCAPED_UNICODE);
  exit;
}

$text = trim($data['candidates'][0]['content']['parts'][0]['text'] ?? '');
$text = preg_replace('/^```json\s*/iu', '', $text);
$text = preg_replace('/^```\s*/u', '', $text);
$text = preg_replace('/\s*```$/u', '', $text);
$out = json_decode($text, true);
if (!is_array($out) || empty($out['responses']) || empty($out['final'])) {
  http_response_code(502);
  echo json_encode(['ok' => false, 'error' => 'AI yaniti beklenen JSON formatinda degil.'], JSON_UNESCAPED_UNICODE);
  exit;
}

$keys = ['cezeri','mimar','farabi','tonyukuk','vedat'];
$titles = ['Cezeri - Strateji ve Kapsam','Mimar Sinan - Tasarim ve Marka Dili','Farabi - Teknik Plan','Tonyukuk - Pazarlama ve Donusum','Cezeri Kurulu - Son Karar'];
$fixed = [];
for ($i = 0; $i < 5; $i++) {
  $item = $out['responses'][$i] ?? [];
  $fixed[] = ['key'=>$keys[$i], 'title'=>trim((string)($item['title'] ?? $titles[$i])), 'text'=>trim((string)($item['text'] ?? ''))];
}
$out['responses'] = $fixed;
$out['customerSummary'] = trim((string)($out['customerSummary'] ?? ''));
$out['teamBrief'] = trim((string)($out['teamBrief'] ?? ''));
$out['projectFile'] = is_array($out['projectFile'] ?? null) ? $out['projectFile'] : [];
$out['final'] = trim((string)$out['final']);
$out['ok'] = true;

echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>
