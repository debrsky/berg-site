const gulp = require(`gulp`);
const server = require(`browser-sync`).create();

const copy = require(`./copy`);
const svg = require(`./svg.js`);
const style = require(`./style`);
const html = require(`./html`);
const pug2html = require(`./pug2html`);
const pages = require(`./pages`);
const script = require(`./script`);

function readyFullReload(cb) {
  server.reload();
  cb(null);
}

function readyStyleReload(cb) {
  return gulp.src("public/css").pipe(server.stream()).on("end", cb);
}

module.exports = function serve() {
  server.init({
    server: `public/`,
    notify: false,
    open: true,
    cors: true,
    // ui: false
    ui: {
      port: 8080
    }
  });

  gulp.watch(`src/css/**/*.css`, gulp.series(style, readyStyleReload));
  gulp.watch(`src/less/**/*.less`, gulp.series(style, readyStyleReload));
  gulp.watch(`src/**/*.html`, gulp.series(html, readyFullReload));
  gulp.watch(`src/pug/**/*.pug`, gulp.series(pug2html, readyFullReload));
  gulp.watch(`src/pages/**/*.pug`, gulp.series(pages, readyFullReload));

  gulp.watch(`src/js/index.js`, gulp.series(script, readyFullReload));
  gulp.watch(
    [`src/**/*.js`, `!src/js/index.js`],
    gulp.series(copy, readyFullReload)
  );
  gulp.watch(`src/img/**/!(*.svg)`, gulp.series(copy, readyFullReload));
  gulp.watch(
    `src/img/**/*.svg`,
    gulp.series(svg, html, pug2html, readyFullReload)
  );
};
