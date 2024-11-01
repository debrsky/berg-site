<?php
/**
 * Deploy Script
 *
 * This script handles deployment of files via ZIP archive upload.
 *
 * @author Claude from Anthropic
 */

header('Content-Type: application/json');

// Загрузка конфигурации
$config = require_once __DIR__ . '/config.php';

// Проверка токена авторизации
$headers = getallheaders();
$token = isset($headers['authorization']) ? str_replace('Bearer ', '', $headers['authorization']) : null;

if (!$token || $token !== $config['auth_token']) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Проверяем наличие загруженного файла
if (!isset($_FILES['archive']) || $_FILES['archive']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded or upload error']);
    exit;
}

$uploadedFile = $_FILES['archive']['tmp_name'];
$targetDir = $config['target_directory'];

try {
    // Создаем временную директорию для распаковки
    $tempDir = $config['temp_directory'] . '/' . uniqid('deploy_');
    if (!mkdir($tempDir)) {
        throw new Exception('Failed to create temp directory');
    }

    // Распаковываем архив
    $zip = new ZipArchive();
    if ($zip->open($uploadedFile) !== true) {
        throw new Exception('Failed to open archive');
    }

    $zip->extractTo($tempDir);
    $zip->close();

    // Перемещаем файлы в целевую директорию
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    // Рекурсивно копируем те файлы из временной директории, содержимое которых изменилось
    function recursiveCopy($src, $dst) {
      $dir = opendir($src);
      if (!is_dir($dst)) {
          mkdir($dst);
      }
      while (($file = readdir($dir))) {
          if ($file != '.' && $file != '..') {
              $srcFile = $src . '/' . $file;
              $dstFile = $dst . '/' . $file;

              if (is_dir($srcFile)) {
                  recursiveCopy($srcFile, $dstFile);
              } else {
                  // Проверяем существует ли файл в целевой директории
                  if (!file_exists($dstFile)) {
                      // Новый файл - копируем
                      copy($srcFile, $dstFile);
                  } else {
                      // Сравниваем содержимое файлов
                      $srcHash = md5_file($srcFile);
                      $dstHash = md5_file($dstFile);

                      if ($srcHash !== $dstHash) {
                          // Содержимое изменилось - копируем
                          copy($srcFile, $dstFile);
                      }
                  }
              }
          }
      }
      closedir($dir);
  }
    recursiveCopy($tempDir, $targetDir);

    // Очищаем временные файлы
    function recursiveDelete($dir) {
        if (is_dir($dir)) {
            $files = array_diff(scandir($dir), array('.', '..'));
            foreach ($files as $file) {
                $path = $dir . '/' . $file;
                is_dir($path) ? recursiveDelete($path) : unlink($path);
            }
            return rmdir($dir);
        }
    }

    recursiveDelete($tempDir);

    echo json_encode([
        'success' => true,
        'message' => 'Archive successfully deployed',
        'backup' => $config['backup']['enabled'] ? $backupName : null
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Deployment failed',
        'message' => $e->getMessage()
    ]);

    // Очистка в случае ошибки
    if (isset($tempDir) && is_dir($tempDir)) {
        recursiveDelete($tempDir);
    }
}
