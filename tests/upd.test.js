import {createHash} from "node:crypto";
import {test} from "node:test";
import {strict as assert} from "node:assert";
import {generateUPD} from "../src/js/client-doc/upd.js";
import {cases} from "./upd-fixtures.js";

// SHA-256 of the expected HTML, including whitespace and inline CSS.
const expected = [
  "04321b8a3c60ea12fbee7bbbf9a30a2bded165701de27a365360ded4732a1fc4",
  "5f430b15af46a5620b7e6b82d379f7d5b093886737ab7e86d1fe74e63629ad88",
  "9a7dbf9051b392d27f94cf82a572f58a809f1127919de0b917a93b3ec1c021ee",
  "c310825281e23b8c1ec75941280eb5fe9a81d805f1c2b3503e91251f0c2948e1"
];

cases.forEach(({name, data, options}, index) => {
  test(`generateUPD: ${name}`, () => {
    const result = generateUPD(data, options);
    assert.equal(result.title, "УПД");
    assert.equal(result.orientation, "landscape");
    assert.match(
      result.html,
      /Данные о транспортировке и грузе<\/td>\s*<td class="upd-border-bottom"><\/td>\s*<td style="width: 6mm;">\[11\]<\/td>/
    );
    assert.equal(
      createHash("sha256").update(result.html).digest("hex"),
      expected[index]
    );
  });
});
