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

  // Create archive
  await new Promise((resolve, reject) => {
    src(['public/**/*'], { base: 'public' })
      .pipe(archiver(outputFile))
      .pipe(dest('.'))
      .on('end', resolve)
      .on('error', reject);
  });

  const fileStat = await fs.promises.stat(outputFile);
  console.log('Archive created:', outputFile, fileStat.size);

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

    console.log(response.status, response.statusText);
    if (!response.ok) {
      const text = await response.text();
      console.log(text);
      throw new Error('Deploy failed');
    }

    const result = await response.json();
    console.log('Deploy successful:', result.message);
    console.log(result);

    // Clean up archive file
    fs.unlinkSync(outputFile);

  } catch (error) {
    console.error('Deploy error:', error.message);
    throw error;
  }
}
