import gulp from "gulp";
import browserSync from "browser-sync";

import copy from "./copy.js";
import svg from "./svg.js";
import style from "./style.js";
import html from "./html.js";
import pug2html from "./pug2html.js";
import pages from "./pages.js";
import script from "./script.js";

const server = browserSync.create();

function readyFullReload(cb) {
  server.reload();
  cb(null);
}

function readyStyleReload(cb) {
  return gulp.src("public/css").pipe(server.stream()).on("end", cb);
}

export default function serve() {
  server.init({
    server: `public/`,
    notify: false,
    open: true,
    cors: true,
    // ui: false
    ui: {
      port: 3080
    }
  });

  gulp.watch(`src/css/**/*.css`, gulp.series(style, readyStyleReload));
  gulp.watch(`src/less/**/*.less`, gulp.series(style, readyStyleReload));
  gulp.watch(`src/**/*.html`, gulp.series(html, readyFullReload));
  gulp.watch(`src/pug/**/*.pug`, gulp.series(pug2html, readyFullReload));
  gulp.watch(`src/pages/**/*.pug`, gulp.series(pages, readyFullReload));

  gulp.watch(`src/js/**/*.js`, gulp.series(script, readyFullReload));
  gulp.watch(`src/img/**/!(*.svg)`, gulp.series(copy, readyFullReload));
  gulp.watch(
    `src/img/**/*.svg`,
    gulp.series(svg, html, pug2html, readyFullReload)
  );
}
