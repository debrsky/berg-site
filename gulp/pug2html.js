const gulp = require("gulp");
const plumber = require("gulp-plumber");
const pug = require("gulp-pug");
const pugLinter = require("gulp-pug-linter");
const htmlValidator = require("gulp-w3c-html-validator");
const bemValidator = require("gulp-html-bem-validator");
const rename = require(`gulp-rename`);

module.exports = function pug2html() {
  const pugOptions = {
    pretty: true,
    basedir: process.rootDir
  };

  return (
    gulp
      .src("src/*.pug")
      .pipe(plumber())
      .pipe(pugLinter({reporter: "default"}))
      .pipe(pug(pugOptions))
      // .pipe(
      //   rename((path) => {
      //     path.basename = path.basename + `.pug`;
      //   })
      // )
      .pipe(htmlValidator())
      // .pipe(bemValidator())
      .pipe(gulp.dest("public"))
  );
};
