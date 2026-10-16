import {readFileSync, readdirSync} from "node:fs";
import {test} from "node:test";
import {strict as assert} from "node:assert";
import bemValidator from "gulp-html-bem-validator/src/index.js";

// The Gulp wrapper only logs warnings and does not fail the build.
// Use the same installed validator engine to make regressions fail tests.
test("BEM: generated HTML has no validator warnings", () => {
  const directory = new URL("../public/", import.meta.url);
  const files = readdirSync(directory, {recursive: true}).filter((name) =>
    name.endsWith(".html")
  );
  assert.ok(files.length > 0, "Run npm run build before these tests");
  for (const name of files) {
    const content = readFileSync(
      new URL(name.replaceAll("\\", "/"), directory),
      "utf8"
    );
    const {countBemWarning} = bemValidator.htmlBemValidator({content});
    assert.equal(countBemWarning, 0, `BEM warnings in ${name}`);
  }
});
