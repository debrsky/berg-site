const gulp = require(`gulp`);
const plumber = require(`gulp-plumber`);
const rename = require(`gulp-rename`);
const sourcemap = require("gulp-sourcemaps");
const lessG = require("gulp-less");

module.exports = function less() {
  return (
    gulp
      .src(`src/less/style.less`)
      .pipe(plumber())
      .pipe(sourcemap.init())
      .pipe(lessG({math: "parens-division"}))
      // .pipe(postcss([
      //   autoprefixer()
      // ]))
      // .pipe(csso())
      .pipe(rename(`style.css`))
      .pipe(sourcemap.write(`.`))
      .pipe(gulp.dest(`public/css`))
  );
};
