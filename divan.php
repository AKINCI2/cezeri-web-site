<?php
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/config.php';
$configured = isset($GEMINI_API_KEY) && $GEMINI_API_KEY && $GEMINI_API_KEY !== 'BURAYA_GEMINI_API_KEY_YAZ';
echo json_encode(['configured' => $configured, 'provider' => 'gemini', 'model' => $GEMINI_MODEL], JSON_UNESCAPED_UNICODE);
?>
