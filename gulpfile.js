import {fileURLToPath} from "url";
import {dirname} from "path";

import "dotenv/config";

import gulp from "gulp";
import serve from "./gulp/serve.js";
import clean from "./gulp/clean.js";
import copy from "./gulp/copy.js";
import images from "./gulp/images.js";
import svg from "./gulp/svg.js";
import html from "./gulp/html.js";
import pug2html from "./gulp/pug2html.js";
import style from "./gulp/style.js";
import script from "./gulp/script.js";
import validateHTML from "./gulp/validate-html.js";
import sitemap from "./gulp/sitemap.js";

import ghPages from "./gulp/deploy-to-gh-pages.js";
import ftpProd from "./gulp/deploy-to-ftp-prod.js";
import ftpTest from "./gulp/deploy-to-ftp-test.js";
import deployZ from "./gulp/deploy-z.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
process.rootDir = __dirname;

const build = gulp.series(
  clean,
  copy,
  svg,
  html,
  pug2html,
  sitemap,
  style,
  script
);
const dev = gulp.series(build, validateHTML, serve);
const validate = gulp.series(clean, copy, svg, html, pug2html, validateHTML);

const deployToGh = gulp.series(build, ghPages);
const deployToFtpProd = gulp.series(build, ftpProd);
const deployToFtpTest = gulp.series(build, ftpTest);
const deployToZ = gulp.series(build, deployZ);

export {
  dev,
  build,
  validate,
  clean,
  copy,
  images,
  html,
  pug2html,
  validateHTML,
  sitemap,
  style,
  script,
  serve,
  deployToGh,
  deployToFtpProd,
  deployToFtpTest,
  deployToZ
};
