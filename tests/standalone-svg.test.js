import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync, readdirSync} from "node:fs";

const directory = new URL("../src/img/", import.meta.url);
const palette = readFileSync(
  new URL("../src/less/blocks/landing-shell.less", import.meta.url),
  "utf8"
);
const sharedPalette = readFileSync(
  new URL("../src/less/scaffolding.less", import.meta.url),
  "utf8"
);

test("Landing SVGs have standalone colors and XML-compatible data attributes", () => {
  for (const name of readdirSync(directory).filter((file) =>
    /^route-.*\.svg$/.test(file)
  )) {
    const svg = readFileSync(new URL(name, directory), "utf8");
    assert.doesNotMatch(svg, /\sdata-[\w-]+(?=[\s/>])/, name);
    assert.doesNotMatch(svg, /var\(--[\w-]+\)/, name);
    for (const [, token, color] of svg.matchAll(
      /var\((--[\w-]+),\s*(#[\da-f]+)\)/gi
    )) {
      const definition = new RegExp(token + ":\\s*(#[\\da-f]+)", "i");
      const expected =
        palette.match(definition) || sharedPalette.match(definition);
      assert.equal(color, expected?.[1], name + ": " + token);
    }
  }
});
