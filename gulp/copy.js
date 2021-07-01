const gulp = require(`gulp`);

module.exports = function copy() {
  return gulp
    .src(
      [
        `src/css/**/*.css`,
        `src/fonts/**/*.{woff,woff2}`,
        `src/img/**/*.{jpg,webp,png}`,
        `src/*.ico`
      ],
      {
        base: `src`
      }
    )
    .pipe(gulp.dest(`public`));
};
