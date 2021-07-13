const gulp = require(`gulp`);

function css() {
  return gulp.src(`src/css/**/*.css`).pipe(gulp.dest(`public/css`));
}

module.exports = css;
