<?php
// Cezeri Divanı AI ayarları - Gemini sürümü
// Gemini API anahtarını sadece bu dosyaya yaz. HTML/JS içine yazma.
// Örnek: $GEMINI_API_KEY = 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

$GEMINI_API_KEY = getenv('GEMINI_API_KEY') ?: 'BURAYA_GEMINI_API_KEY_YAZ';
$GEMINI_MODEL = getenv('GEMINI_MODEL') ?: 'gemini-2.5-flash';
?>
