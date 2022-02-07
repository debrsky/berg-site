<?php
// https://shpaginkirill.medium.com/the-sane-phpmailer-instruction-sending-message-and-files-to-the-mail-4dbbeb395aed

// Файлы phpmailer
require 'phpmailer/PHPMailer.php';
require 'phpmailer/SMTP.php';
require 'phpmailer/Exception.php';

require('config.php');

$body = "<div>Check sending mail</div>";

$mail = new PHPMailer\PHPMailer\PHPMailer();

// Настройки PHPMailer
$mail = new PHPMailer\PHPMailer\PHPMailer();
try {
  // $mail->isSMTP();
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
  $mail->AddReplyTo($config['ReplyToEmail'], $config['ReplyToName']); // Адрес для ответа и имя получателя ответа

  // Получатель письма
  // $mail->addAddress($config['Reciever']);
  // $mail->addCC($email);

  $mail->addAddress('konstantin.konstantinopolskij@yandex.ru');

  // Отправка сообщения
  $mail->isHTML(true);
  $mail->Subject = "Check sending mail";
  $mail->Body = $body;

  // Проверяем отравленность сообщения
  if ($mail->send()) {
    $result = "success";
  } else {
    $result = "error";
  };

} catch (Exception $e) {
  $result = "error";
  $status = "Сообщение не было отправлено. Причина ошибки: {$mail->ErrorInfo}";
};

// Отображение результата
header('Content-Type: application/json; charset=utf-8');
http_response_code(200);
echo json_encode(["result" => $result, "status" => $status], JSON_UNESCAPED_UNICODE);
