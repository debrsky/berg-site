const {src, dest} = require("gulp");
const sharpResponsive = require("gulp-sharp-responsive");
const del = require(`del`);

module.exports = function images() {
  del.sync(`images`);
  return src([`docs/presentation/*.jpg`, `!docs/presentation/z*`], {
    base: `docs`
  })
    .pipe(
      sharpResponsive({
        formats: [
          {
            width: ({width, height}) =>
              height < 400 ? width : Math.round((400 / height) * width),
            rename: {suffix: "@x400"}
          },
          {
            width: ({width, height}) =>
              height < 400 ? width : Math.round((400 / height) * width),
            rename: {suffix: "@x400"},
            format: "webp"
          },
          {
            width: ({width, height}) =>
              height < 400 ? width : Math.round((400 / height) * width),
            rename: {suffix: "@x400"},
            format: "avif"
          }
        ]
      })
    )
    .pipe(dest(`images`));
};
