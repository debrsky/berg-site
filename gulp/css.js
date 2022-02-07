import gulp from "gulp";

export default function css() {
  return gulp.src(`src/css/**/*.css`).pipe(gulp.dest(`public/css`));
}
