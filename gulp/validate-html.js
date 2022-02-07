const gulp = require(`gulp`);
const plumber = require(`gulp-plumber`);
const bemValidator = require("gulp-html-bem-validator");

module.exports = async function validateHTML() {
  const {htmlValidator} = await import("gulp-w3c-html-validator");
  return gulp
    .src(`public/**/*.html`)
    .pipe(plumber()) // catch "service unavailable" of gulp-w3c-html-validator
    .pipe(htmlValidator.analyzer())
    .pipe(htmlValidator.reporter())
    .pipe(bemValidator());
};
