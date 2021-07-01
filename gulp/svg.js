const imagemin = require("gulp-imagemin");
const gulp = require(`gulp`);

module.exports = function svg() {
  return gulp
    .src([`src/img/**/*.svg`], {
      base: `src`
    })
    .pipe(imagemin([imagemin.svgo()]))
    .pipe(gulp.dest(`public`));
};
