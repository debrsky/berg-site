import {test} from "node:test";
import {strict as assert} from "node:assert";
import {fileURLToPath} from "node:url";
import pug from "pug";

const options = {
  filename: fileURLToPath(new URL("./package-fixture.pug", import.meta.url)),
  basedir: fileURLToPath(new URL("../", import.meta.url))
};

test("packaging: missing dedicated contacts are omitted without fallback", () => {
  const html = pug.render(
    "extends ../src/pages/package.pug\nappend variables\n  - Object.values(business.terminals).forEach((terminal) => { terminal.phones = terminal.phones.filter((phone) => !phone.packaging); });",
    options
  );
  assert.doesNotMatch(html, /<p>Владивосток:|<p>Хабаровск:/);
  assert.doesNotMatch(html, /сотрудников площадки|tel:undefined/);
  assert.match(html, /Виды упаковки груза/);
});

test("packaging: only contacts marked packaging appear in order contacts", () => {
  const html = pug.render(
    'extends ../src/pages/package.pug\nappend variables\n  - business.terminals.vvo.phones.push({number: "+70000000001", text: "Test packaging", role: "Test", packaging: true});\n  - business.terminals.vvo.phones = business.terminals.vvo.phones.filter((phone) => !phone.packaging || phone.number === "+70000000001");\n  - business.terminals.khb.phones = business.terminals.khb.phones.filter((phone) => !phone.packaging);',
    options
  );
  assert.match(
    html,
    /<p>Владивосток: <a href="tel:\+70000000001">Test packaging<\/a>/
  );
  assert.doesNotMatch(html, /<p>Хабаровск:|tel:undefined/);
});
