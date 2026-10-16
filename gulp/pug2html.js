import gulp from "gulp";
import plumber from "gulp-plumber";
import pug from "gulp-pug";
import pugLinter from "gulp-pug-linter";
import {calculateCargo} from "../src/js/common/calculate.js";

export default function pug2html() {
  const pugOptions = {
    doctype: "html",
    locals: {calculateCargo},
    pretty: false,
    basedir: process.rootDir
  };

  return gulp
    .src("src/pages/*.pug")
    .pipe(plumber())
    .pipe(pugLinter({reporter: "default"}))
    .pipe(pug(pugOptions))
    .pipe(gulp.dest("public"));
}
