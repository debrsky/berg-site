import gulp from "gulp";
import sharpResponsive from "gulp-sharp-responsive";
import del from "del";

const {src, dest} = gulp;

export default function images() {
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
}
