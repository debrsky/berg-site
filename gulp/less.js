import gulp from "gulp";
import plumber from "gulp-plumber";
import rename from "gulp-rename";
import sourcemap from "gulp-sourcemaps";
import lessG from "gulp-less";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import doiuse from "doiuse";

export default function less() {
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
}
