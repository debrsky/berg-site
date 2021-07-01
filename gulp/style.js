const {parallel} = require("gulp");

const css = require("./css");
const less = require("./less");

module.exports = function style() {
  return parallel(css, less)(...arguments);
};
