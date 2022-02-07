import gulp from "gulp";
// import imagemin, {gifsicle, mozjpeg, optipng, svgo} from 'gulp-imagemin';
import imagemin, {svgo} from "gulp-imagemin";

export default function svg() {
  return gulp
    .src([`src/img/**/*.svg`], {
      base: `src`
    })
    .pipe(
      imagemin([
        svgo({
          plugins: [{name: "cleanupIDs", active: false}]
        })
      ])
    )
    .pipe(gulp.dest(`public`));
}
