<?php
require('makehtml.php');

$json = $_POST['data'];

$data = json_decode($json);

$meta = new stdClass();

$meta->{"User-agent"} = $_SERVER['HTTP_USER_AGENT']??'';
$meta->{"ip"} = $_SERVER['REMOTE_ADDR']??'';

$dt = new DateTime("now", new DateTimeZone('Asia/Vladivostok'));
$meta->{"timestamp"} = $dt->format('Y-m-d H:i:s T');

$data->meta = $meta;

// var_dump($data->meta->timestamp);

$html = makehtml($data);

// sleep(3);
//header('Content-Type: application/json; charset=utf-8');
header('Content-Type: text/plain; charset=utf-8');
http_response_code(200);
echo $html;
// echo json_encode($data, JSON_UNESCAPED_UNICODE);
