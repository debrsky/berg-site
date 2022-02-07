import gulp from "gulp";
import plumber from "gulp-plumber";
import bemValidator from "gulp-html-bem-validator";
import {htmlValidator} from "gulp-w3c-html-validator";

export default function validateHTML() {
  return gulp
    .src(`public/**/*.html`)
    .pipe(plumber()) // catch "service unavailable" of gulp-w3c-html-validator
    .pipe(htmlValidator.analyzer())
    .pipe(htmlValidator.reporter())
    .pipe(bemValidator());
}
