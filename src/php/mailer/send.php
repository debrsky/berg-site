<?php
// Файлы phpmailer
require 'phpmailer/PHPMailer.php';
require 'phpmailer/SMTP.php';
require 'phpmailer/Exception.php';

require('config.php');
require('makehtml.php');


$json = $_POST['data'];

$data = json_decode($json);

$meta = new stdClass();

$meta->{"User-agent"} = $_SERVER['HTTP_USER_AGENT']??'';
$meta->{"ip"} = $_SERVER['REMOTE_ADDR']??'';

$dt = new DateTime("now", new DateTimeZone('Asia/Vladivostok'));
$meta->{"timestamp"} = $dt->format('Y-m-d H:i:s T');
$data->meta = $meta;

$direction = $data->loading->place . ' => ' . $data->unloading->place;
$order_date = DateTime::createFromFormat('Y-m-d', $data->loading->date)->format('Y-m-d');
$cargo = $data->cargo->name;
$cargo_weight = $data->cargo->weight;
$cargo_volume = $data->cargo->volume;
$cargo_qty = $data->cargo->qty;
$email = $data->author->email;

$html = makehtml($data);

$title = "[$direction] $order_date $cargo ($cargo_weight кг|$cargo_volume м³|$cargo_qty)";

$body = $html;

$mail = new PHPMailer\PHPMailer\PHPMailer();

// Настройки PHPMailer
$mail = new PHPMailer\PHPMailer\PHPMailer();
try {
  $mail->isSMTP();
  $mail->CharSet = "UTF-8";
  $mail->SMTPAuth   = true;
  //$mail->SMTPDebug = 2;
  $mail->Debugoutput = function($str, $level) {$GLOBALS['status'][] = $str;};

  // Настройки вашей почты
  $mail->Host       = $config['Host']; // SMTP сервера вашей почты
  $mail->Username   = $config['Username']; // Логин на почте
  $mail->Password   = $config['Password']; // Пароль на почте
  $mail->SMTPSecure = $config['SMTPSecure'];
  $mail->Port       = $config['Port'];
  $mail->setFrom($config['FromEmail'], $config['FromName']); // Адрес самой почты и имя отправителя

  // Получатель письма
  $mail->addAddress($config['Reciever']);
  $mail->addCC($email);
  // $mail->addAddress('konstantin.konstantinopolskij1@gmail.com'); // Ещё один, если нужен

  // Отправка сообщения
  $mail->isHTML(true);
  $mail->Subject = $title;
  $mail->Body = $body;

  // Проверяем отравленность сообщения
  if ($mail->send()) {$result = "success";}
  else {$result = "error";}

} catch (Exception $e) {
  $result = "error";
  $status = "Сообщение не было отправлено. Причина ошибки: {$mail->ErrorInfo}";
};

$message = json_encode($data, JSON_UNESCAPED_UNICODE);

// log
$myfile = file_put_contents('log.txt', $message.PHP_EOL , FILE_APPEND | LOCK_EX);

// Отображение результата
header('Content-Type: application/json; charset=utf-8');
http_response_code(200);
echo $message;
