import gulp from "gulp";
import imagemin from "gulp-imagemin";

export default function svg() {
  return gulp
    .src([`src/img/**/*.svg`], {
      base: `src`
    })
    .pipe(
      imagemin([
        imagemin.svgo({
          plugins: [{cleanupIDs: false}]
        })
      ])
    )
    .pipe(gulp.dest(`public`));
}
