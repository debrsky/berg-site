require("dotenv").config();

const gulp = require("gulp");
const serve = require(`./gulp/serve`);
const clean = require(`./gulp/clean`);
const copy = require(`./gulp/copy`);
const images = require(`./gulp/images`);
const svg = require(`./gulp/svg`);
const html = require(`./gulp/html`);
const pug2html = require(`./gulp/pug2html`);
const style = require(`./gulp/style`);
const script = require(`./gulp/script`);
const validateHTML = require(`./gulp/validate-html`);

const ghPages = require(`./gulp/deploy-to-gh-pages`);
const ftpProd = require(`./gulp/deploy-to-ftp-prod`);
const ftpTest = require(`./gulp/deploy-to-ftp-test`);

const build = gulp.series(clean, copy, svg, html, pug2html, style, script);
const dev = gulp.series(build, validateHTML, serve);
const validate = gulp.series(clean, copy, svg, html, pug2html, validateHTML);

const deployToGh = gulp.series(build, ghPages);
const deployToFtpProd = gulp.series(build, ftpProd);
const deployToFtpTest = gulp.series(build, ftpTest);

process.rootDir = __dirname;

module.exports = {
  dev,
  build,
  validate,
  clean,
  copy,
  images,
  html,
  pug2html,
  validateHTML,
  style,
  script,
  serve,
  deployToGh,
  deployToFtpProd,
  deployToFtpTest
};
