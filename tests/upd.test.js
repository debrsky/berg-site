import {createHash} from "node:crypto";
import {test} from "node:test";
import {strict as assert} from "node:assert";
import {generateUPD} from "../src/js/client-doc/upd.js";
import {cases} from "./upd-fixtures.js";

// SHA-256 of the original HTML, including whitespace and inline CSS.
const expected = [
  "0b52eb793e5db44cb7e934fb9e61d9776109bd4c00351001b0939e37d5854ec7",
  "d08bb4b96d3ed82f1e31c80e7a7bf03c49c6f3838763f1cf821b93f765c403e4",
  "9ba0c4e949d368940f3133c963a4b075d07613f067b41f836014d3594492374d",
  "c07256c91d67c15ccdccdc0e5b911eb091c67babf0452c2bd7a0c07bfb50cd58"
];

cases.forEach(({name, data, options}, index) => {
  test(`generateUPD: ${name}`, () => {
    const result = generateUPD(data, options);
    assert.equal(result.title, "УПД");
    assert.equal(result.orientation, "landscape");
    assert.equal(
      createHash("sha256").update(result.html).digest("hex"),
      expected[index]
    );
  });
});
