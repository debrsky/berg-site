const gulp = require("gulp");
const plumber = require("gulp-plumber");
const pug = require("gulp-pug");
const pugLinter = require("gulp-pug-linter");
// const htmlValidator = require("gulp-w3c-html-validator");
// const bemValidator = require("gulp-html-bem-validator");
// const rename = require(`gulp-rename`);

module.exports = function pages() {
  const pugOptions = {
    pretty: true,
    basedir: process.rootDir
  };

  const paths = {
    pages: {
      src: "src/pages/**/*.pug",
      dest: "public"
    }
  };

  return (
    gulp
      .src(paths.pages.src, {since: gulp.lastRun(pages)})
      .pipe(plumber())
      .pipe(pugLinter({reporter: "default"}))
      .pipe(pug(pugOptions))
      // .pipe(htmlValidator())
      // .pipe(bemValidator())
      .pipe(gulp.dest(paths.pages.dest))
  );
};
