import gulp from "gulp";

function copySources() {
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
        `src/php/**/*.php`,
        `!src/php/**/config.php`,
        `src/files/**/*.*`
      ],
      {
        base: `src`,
        encoding: false
      }
    )
    .pipe(gulp.dest(`public`));
}

function copySuggestionsStyles() {
  return gulp
    .src("node_modules/@dadata/suggestions/dist/suggestions.min.css")
    .pipe(gulp.dest("public/vendor/suggestions"));
}

export default function copy() {
  return gulp.parallel(copySources, copySuggestionsStyles)(...arguments);
}
