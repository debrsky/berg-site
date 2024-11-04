import { Transform } from 'stream';
function transform(options) {
  return new Transform(options);
};
import crypto from 'crypto';
import gulp from "gulp";
const { src, dest } = gulp;
import archiver from 'gulp-archiver';
import fs from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import fetch from 'node-fetch';
import { FormData } from 'formdata-node';
import { fileFromPath } from "formdata-node/file-from-path";

export default async function deployZ() {
  const outputFile = join(tmpdir(), `temp-${Date.now()}-${Math.random().toString(36).slice(2)}.zip`);

  const serverFileList = {};

  // get file list
  try {
    const url = process.env.DEPLOY_URL;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.DEPLOY_TOKEN}`,
      }
    });

    console.log('Запрос списка файлов:', response.status, response.statusText);
    if (!response.ok) {
      const text = await response.text();
      console.log(text);
      throw new Error('Deploy failed');
    }

    const result = await response.json();
    Object.assign(serverFileList, result.files);
    Object.entries(serverFileList).forEach(([key, value]) => {
      serverFileList[key] = value.replace(/\\/g, '/');
    })

    console.log('Получен список файлов, всего файлов:', Object.keys(serverFileList).length);
  } catch (error) {
    throw error;
  };

  // Create archive
  await new Promise((resolve, reject) => {
    src(['public/**/*'], { base: 'public' })
      .pipe(transform({
        objectMode: true,
        transform(file, encoding, callback) {
          if (!file.isBuffer()) return callback(); // пропускаем директории

          const hash = crypto.createHash('md5');
          hash.update(file.contents);
          const md5 = hash.digest('hex');
          const filePath = file.relative?.replace(/\\/g, '/');
          const fileSize = file.contents.length;
          const isFileModified = md5 !== serverFileList[filePath];

          delete serverFileList[filePath];

          if (isFileModified) {
            console.log('to deploy:', filePath, fileSize);
            callback(null, file);
          } else {
            // console.log('skip:', filePath, fileSize);
            callback();
          }
        }
      }))
      .pipe(archiver(outputFile))
      .pipe(dest('.'))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log('Файлы на сервере, отсутствующие в списке на деплой');
  console.log(Object.keys(serverFileList));

  let fileStat;
  try {
    fileStat = await fs.promises.stat(outputFile);
    console.log('Archive created:', outputFile, fileStat.size);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    console.log("Нет измененных файлов, нечего деплоить");
    return;
  };

  // Send archive to server
  try {
    const formData = new FormData();

    formData.append('archive', await fileFromPath(outputFile));

    // const url = 'https://httpbin.org/post';
    const url = process.env.DEPLOY_URL;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${process.env.DEPLOY_TOKEN}`,
      }
    });

    console.log('Отправка архива:', response.status, response.statusText);
    if (!response.ok) {
      const text = await response.text();
      console.log(text);
      throw new Error('Deploy failed');
    }

    const result = await response.json();

    delete result.missing_files;

    console.log(result);
    console.log('Deploy successful:', result.message);

    // Clean up archive file
    fs.unlinkSync(outputFile);

  } catch (error) {
    console.error('Deploy error:', error.message);
    throw error;
  }
}
