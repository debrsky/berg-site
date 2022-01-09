const gulp = require(`gulp`);
const plumber = require(`gulp-plumber`);
const rename = require(`gulp-rename`);
const sourcemap = require("gulp-sourcemaps");
const lessG = require("gulp-less");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const doiuse = require("doiuse");
// const csso = require("postcss-csso");

// const colors = require("colors");

module.exports = function less() {
  return gulp
    .src(`src/less/style.less`)
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(lessG({math: "parens-division"}))
    .pipe(
      postcss([
        autoprefixer(),
        doiuse({
          onFeatureUsage: function (info) {
            const selector = info.usage.parent.selector;
            const property = `${info.usage.prop}: ${info.usage.value}`;

            let status = info.featureData.caniuseData.status.toUpperCase();

            if (info.featureData.missing) {
              status = "NOT SUPPORTED".red;
            } else if (info.featureData.partial) {
              status = "PARTIAL SUPPORT".yellow;
            }

            console.log(
              `\n${status}:\n\n    ${selector} {\n        ${property};\n    }\n`
            );
          }
        }) /*, csso() */
      ])
    )
    .pipe(rename(`style.css`))
    .pipe(sourcemap.write(`.`))
    .pipe(gulp.dest(`public/css`));
};
