const gulp = require("gulp");
const rollup = require("@rollup/stream");
const terser = require("rollup-plugin-terser").terser;
const nodeResolve = require("@rollup/plugin-node-resolve").nodeResolve;
const sourcemaps = require("gulp-sourcemaps");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const glob = require("glob");
const path = require("path");

//TODO add cache
// https://github.com/rollup/stream#caching

module.exports = function script(cb) {
  glob("src/js/*.js", {}, (err, files) => {
    if (err) return console.err(err);

    Promise.all(
      files.map((file) => {
        const {base} = path.parse(file);
        new Promise((resolve, reject) => {
          rollup({
            input: file,
            external: ["jquery"],
            output: {
              sourcemap: true,
              format: "iife",
              globals: {jquery: "$"},
              plugins: [terser()]
            },
            plugins: [nodeResolve()]
          })
            // point to the entry file.
            .pipe(source(base))

            // buffer the output. most gulp plugins, including gulp-sourcemaps, don't support streams.
            .pipe(buffer())

            // tell gulp-sourcemaps to load the inline sourcemap produced by rollup-stream.
            .pipe(sourcemaps.init({loadMaps: true}))

            // transform the code further here.

            // if you want to output with a different name from the input file, use gulp-rename here.
            //.pipe(rename('index.js'))

            // write the sourcemap alongside the output file.
            .pipe(sourcemaps.write("."))

            // and output to ./dist/main.js as normal.
            .pipe(gulp.dest("public/js"))
            .on("error", (err) => reject(err))
            .on("finish", () => resolve());
        });
      })
    )
      .then(() => cb())
      .catch((err) => cb(err));
  });
};
