import {readFileSync} from "node:fs";
import {test} from "node:test";
import {strict as assert} from "node:assert";
import postcss from "postcss";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

for (const bundle of ["style", "landing"]) {
  test(`${bundle}: theme initialisation and scrollbars retain layout space`, () => {
    const styles = postcss.parse(read(`../public/css/${bundle}.css`));
    const declarations = (selector) => {
      const values = {};
      styles.walkRules((rule) => {
        if (!rule.selectors.includes(selector)) return;
        rule.walkDecls((decl) => {
          values[decl.prop] = decl.value;
        });
      });
      return values;
    };
    const disabled = declarations(".theme-toggle:disabled");
    assert.equal(disabled.visibility, "hidden");
    assert.notEqual(disabled.display, "none");
    assert.equal(declarations("html")["scrollbar-gutter"], "stable");
    assert.equal(declarations("html")["overflow-y"], "scroll");
  });
}

test("Shared document head preloads regular and bold fonts before styles", () => {
  const html = read("../public/home.html");
  for (const font of ["PTS55F_W", "PTS75F_W"]) {
    const link = html.match(
      new RegExp(`<link[^>]*href="fonts/${font}\\.woff"[^>]*>`)
    )?.[0];
    assert.ok(link);
    assert.match(link, /rel="preload"/);
    assert.match(link, /as="font"/);
    assert.match(link, /crossorigin="anonymous"/);
    assert.ok(html.indexOf(link) < html.indexOf('rel="stylesheet"'));
  }
});
