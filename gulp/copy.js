import gulp from "gulp";

export default function copy() {
  return gulp
    .src(
      [
        `src/css/**/*.css`,
        `src/fonts/**/*.{woff,woff2}`,
        `src/img/**/*.{jpg,webp,avif,png}`,
        `src/img/**/*.gif`,
        `src/img/**/*.mp4`,
        `src/*.ico`,
        `src/*.txt`,
        `src/vendor/**/*.*`,
        `src/php/**/*.php`, `!src/php/**/config.php`,
        `src/files/**/*.*`
      ],
      {
        base: `src`
      }
    )
    .pipe(gulp.dest(`public`));
}
