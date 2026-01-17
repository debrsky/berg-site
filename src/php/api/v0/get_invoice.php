<?php

// Настройки ошибок
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');
error_reporting(E_ALL);

require_once '../../../app/signature.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

header("X-Robots-Tag: noindex, nofollow");

if (!isset($_GET['id_invoice']) || !isset($_GET['sig'])) {
    http_response_code(400); // Bad Request
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Параметры id_invoice и sig обязательны'], JSON_UNESCAPED_UNICODE);
    exit; // Прерываем выполнение
}

$id_invoice = filter_var($_GET['id_invoice'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if ($id_invoice === false) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'id_invoice должен быть положительным целым числом'], JSON_UNESCAPED_UNICODE);
    exit;
}

$sig = $_GET['sig'];

$expected_sig = get_signature($id_invoice);
if ($sig !== $expected_sig) {
    http_response_code(403); // Forbidden
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Подпись неверна. Доступ запрещён'], JSON_UNESCAPED_UNICODE);
    exit;
}

include '../../../app/get_invoice.php';
