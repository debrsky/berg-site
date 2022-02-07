import gulp from "gulp";
import css from "./css.js";
import less from "./less.js";

const {parallel} = gulp;

export default function style() {
  return parallel(css, less)(...arguments);
}
