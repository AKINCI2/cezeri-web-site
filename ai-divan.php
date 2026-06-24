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

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
$project = trim((string)($input['project'] ?? ''));

if (mb_strlen($project, 'UTF-8') < 8) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Proje detayi eksik.'], JSON_UNESCAPED_UNICODE);
  exit;
}

$project = mb_substr($project, 0, 6000, 'UTF-8');

$prompt = <<<PROMPT
Sen Cezeri Digital sitesindeki profesyonel AI Divani'sin. Müşteri talebini analiz edip hem müşteriye güven veren hem de ekibin uygulanabilir proje planı çıkarabileceği kapsamlı bir sonuç üret.

ÖNEMLİ KURALLAR:
- Yanıtı SADECE geçerli JSON olarak döndür. Markdown, açıklama, kod bloğu kullanma.
- Kişisel telefon numarasını veya özel bilgileri divan metninde tekrar etme. Gerekirse "müşteri" de.
- Divanda Vedat Barut adını kullanma. Son kararı "Cezeri Kurulu - Son Karar" olarak yaz.
- Her karakter boş konuşmasın; somut öneri, kapsam, risk, içerik, tasarım, teknik ve pazarlama değeri versin.
- Türkçe yaz. Cümleler kısa, profesyonel ve satışa dönük olsun.
- Hizmet kapsamı belirsizse varsayım yap ama "varsayım" diye açık belirt.

JSON ŞEMASI:
{
  "responses": [
    {"key":"cezeri", "title":"Cezeri - Baş Mühendis", "text":"..."},
    {"key":"mimar", "title":"Mimar Sinan - Tasarım Direktörü", "text":"..."},
    {"key":"farabi", "title":"Farabi - Yazılım Mimarı", "text":"..."},
    {"key":"tonyukuk", "title":"Tonyukuk - Pazarlama Uzmanı", "text":"..."},
    {"key":"vedat", "title":"Cezeri Kurulu - Son Karar", "text":"..."}
  ],
  "final":"..."
}

HER KARAKTERİN ROLÜ:
1. Cezeri: ihtiyacı özetle, proje hedefini, ana modülleri ve öncelikleri çıkar.
2. Mimar Sinan: görsel dil, kullanıcı deneyimi, mobil düzen, güven veren vitrin ve marka hissini planla.
3. Farabi: teknik yapı, sayfa mimarisi, hız, SEO, form/bildirim sistemi ve bakım planını çıkar.
4. Tonyukuk: hedef müşteri, reklam mesajı, sosyal medya, dönüşüm ve içerik stratejisini çıkar.
5. Cezeri Kurulu: uygulanabilir paket, teslim aşamaları, ekip notu, müşteri için net sonraki adımı yaz.

FINAL ALANI ŞU BAŞLIKLARI İÇERSİN:
Proje Özeti
Önerilen Paket
Kapsam
Teslim Aşamaları
Ekibin Notu
Müşteriye Sonraki Adım

MÜŞTERİ TALEBİ:
$project
PROMPT;

$payload = [
  'contents' => [[
    'role' => 'user',
    'parts' => [['text' => $prompt]]
  ]],
  'generationConfig' => [
    'maxOutputTokens' => 1600,
    'temperature' => 0.35,
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
  CURLOPT_TIMEOUT => 45
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
  echo json_encode([
    'ok' => false,
    'error' => $data['error']['message'] ?? ('Gemini HTTP ' . $httpCode),
    'status' => $data['error']['status'] ?? null,
    'code' => $data['error']['code'] ?? null
  ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

$text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
$text = trim($text);
$text = preg_replace('/^```json\s*/iu', '', $text);
$text = preg_replace('/^```\s*/u', '', $text);
$text = preg_replace('/\s*```$/u', '', $text);
$out = json_decode($text, true);

if (!is_array($out) || empty($out['responses']) || empty($out['final'])) {
  http_response_code(502);
  echo json_encode(['ok' => false, 'error' => 'AI yaniti beklenen JSON formatinda degil.'], JSON_UNESCAPED_UNICODE);
  exit;
}

$allowed = ['cezeri', 'mimar', 'farabi', 'tonyukuk', 'vedat'];
$fixedResponses = [];
foreach ($out['responses'] as $i => $item) {
  $fixedResponses[] = [
    'key' => $allowed[$i] ?? ($item['key'] ?? 'cezeri'),
    'title' => trim((string)($item['title'] ?? 'Divan Uyesi')),
    'text' => trim((string)($item['text'] ?? ''))
  ];
}

$out['responses'] = array_slice($fixedResponses, 0, 5);
$out['final'] = trim((string)$out['final']);
$out['ok'] = true;

echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>
