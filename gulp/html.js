import gulp from "gulp";
import posthtml from "gulp-posthtml";
import include from "posthtml-include";

export default function html() {
  return gulp
    .src(`src/**/*.html`)
    .pipe(posthtml([include()]))
    .pipe(gulp.dest(`public`));
}
