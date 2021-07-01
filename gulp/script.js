const gulp = require(`gulp`);
const webpack = require("webpack");
const gulpWebpack = require("webpack-stream");
const webpackConfig = require("../webpack.config.js");

module.exports = function script() {
  return gulp
    .src(`./src/js/index.js`)
    .pipe(gulpWebpack(webpackConfig, webpack))
    .pipe(gulp.dest("public"));
};
