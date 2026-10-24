import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
import setRequired from "../src/js/order/required.js";

const roles = ["consigner", "consignee", "payer"];

test("order INN: all three generated fields use the required control and numeric keyboard", () => {
  const html = readFileSync(
    new URL("../public/order.html", import.meta.url),
    "utf8"
  );
  for (const role of roles) {
    const marker = 'for="' + role + '-INN"';
    const label = html.indexOf(marker);
    assert.ok(label > 0);
    const control = html.slice(
      html.lastIndexOf("<div", label),
      html.indexOf("</div>", label)
    );
    assert.match(control, /control--required/);
    assert.match(control, /class="control__label"/);
    assert.ok(control.includes('id="' + role + '-INN"'));
    assert.match(control, /inputmode="numeric"/);
  }
});

test("order INN: visibility controls required state for companies, people and hidden payer", () => {
  for (const role of roles) {
    let hidden = true;
    const attributes = new Set();
    const input = {
      matches: () => hidden,
      setAttribute: (key) => attributes.add(key),
      removeAttribute: (key) => attributes.delete(key)
    };
    const form = {querySelectorAll: () => [{querySelector: () => input}]};
    setRequired(form);
    assert.equal(attributes.has("required"), false, role);
    hidden = false;
    setRequired(form);
    assert.equal(attributes.has("required"), true, role);
    hidden = true;
    setRequired(form);
    assert.equal(attributes.has("required"), false, role);
  }
});
