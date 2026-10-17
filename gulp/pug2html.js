import gulp from "gulp";
import pug from "gulp-pug";
import pugLinter from "gulp-pug-linter";
import {pipeline} from "node:stream/promises";
import {calculateCargo} from "../src/js/common/calculate.js";
import {landingLocals} from "./landing-data.js";

export default async function pug2html() {
  const options = {
    doctype: "html",
    locals: {calculateCargo, ...(await landingLocals())},
    pretty: false,
    basedir: process.rootDir
  };

  // Await the actual stream completion; a rejected render must fail the build.
  await pipeline(
    gulp.src("src/pages/*.pug"),
    pugLinter({reporter: "default"}),
    pug(options),
    gulp.dest("public")
  );
}
