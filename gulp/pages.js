import gulp from "gulp";
import plumber from "gulp-plumber";
import pug from "gulp-pug";
import pugLinter from "gulp-pug-linter";

export default function pages() {
  const pugOptions = {
    pretty: true,
    basedir: process.rootDir
  };

  const paths = {
    pages: {
      src: "src/pages/**/*.pug",
      dest: "public"
    }
  };

  return gulp
    .src(paths.pages.src, {since: gulp.lastRun(pages)})
    .pipe(plumber())
    .pipe(pugLinter({reporter: "default"}))
    .pipe(pug(pugOptions))
    .pipe(gulp.dest(paths.pages.dest));
}
