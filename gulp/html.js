const gulp = require(`gulp`);
const htmlValidator = require("gulp-w3c-html-validator");
const bemValidator = require("gulp-html-bem-validator");
const posthtml = require("gulp-posthtml");
const include = require("posthtml-include");

module.exports = function html() {
  return (
    gulp
      .src(`src/**/*.html`)
      .pipe(posthtml([include()]))
      // .pipe(htmlValidator())
      // .pipe(bemValidator())
      .pipe(gulp.dest(`public`))
  );
};
