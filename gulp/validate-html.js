const gulp = require(`gulp`);
const plumber = require(`gulp-plumber`);
const htmlValidator = require("gulp-w3c-html-validator");
const bemValidator = require("gulp-html-bem-validator");

module.exports = function validateHTML() {
  return gulp
    .src(`public/**/*.html`)
    .pipe(plumber()) // catch "service unavailable" of gulp-w3c-html-validator
    .pipe(htmlValidator())
    .pipe(bemValidator());
};
