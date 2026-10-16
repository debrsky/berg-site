/* eslint-disable sonarjs/no-duplicate-string -- Explicit field names clarify prefill assertions. */
import {test} from "node:test";
import {strict as assert} from "node:assert";
import {
  normalizeQuantity,
  buildOrderLink,
  parseCargo,
  applyCargo,
  applyOrderPrefill
} from "../src/js/common/calculator-transfer.js";

const tariffs = {
  places: {vvo: "Владивосток", khb: "Хабаровск", blg: "Благовещенск"},
  heavyCargoPrices: [{price: {vvo: {khb: 11, blg: 17}, khb: {vvo: 7}}}]
};
const base = "?origin=vvo&destination=khb";
const input = {origin: "vvo", destination: "khb", weight: "500", volume: "1"};

function makeForm(values = {}) {
  return {
    elements: Object.fromEntries(
      [
        "loading-place",
        "unloading-place",
        "cargo-weight",
        "cargo-volume",
        "cargo",
        "cargo-qty",
        "accept"
      ].map((name) => [name, {value: values[name] ?? "", checked: false}])
    ),
    notice: {hidden: true, textContent: ""},
    events: [],
    querySelector() {
      return this.notice;
    },
    dispatchEvent(event) {
      this.events.push(event.type);
    }
  };
}

test("cargo transfer: decimal formats validated without rounding or interpreting arbitrary input", () => {
  assert.equal(normalizeQuantity("00500,0", 1), "500");
  assert.equal(normalizeQuantity("2.345", 3), "2.345");
  assert.equal(normalizeQuantity("0,001", 3), "0.001");
  for (const value of [
    "",
    "0",
    "0,000",
    "-1",
    "+1",
    " 1",
    "1 ",
    "1e3",
    "NaN",
    "Infinity",
    "1kg",
    "1.2.3",
    "1&accept=accept",
    "<script>",
    "99999999999999999",
    "0." + "0".repeat(40)
  ]) {
    assert.equal(normalizeQuantity(value, 3), null, value);
  }
  assert.equal(normalizeQuantity("0.01", 1), null);
  assert.equal(normalizeQuantity("1.2345", 3), null);
});

test("cargo transfer: calculator links contain only entered quantities and valid routes", () => {
  assert.equal(
    buildOrderLink(tariffs, input),
    "order.html" + base + "&weight=500&volume=1"
  );
  assert.equal(
    buildOrderLink(tariffs, {...input, volume: ""}),
    "order.html" + base + "&weight=500"
  );
  assert.equal(
    buildOrderLink(tariffs, {...input, weight: ""}),
    "order.html" + base + "&volume=1"
  );
  assert.equal(
    buildOrderLink(tariffs, {...input, weight: "", volume: ""}),
    "order.html" + base
  );
  assert.equal(
    buildOrderLink(tariffs, {
      ...input,
      weight: "1,2",
      volume: "0,125",
      accept: "accept",
      cargo: "not-to-transfer"
    }),
    "order.html" + base + "&weight=1.2&volume=0.125"
  );
  assert.equal(
    buildOrderLink(tariffs, {...input, origin: "unknown"}),
    "order.html"
  );
  assert.equal(
    buildOrderLink(tariffs, {...input, destination: "vvo"}),
    "order.html"
  );
});

test("cargo transfer: URL parser accepts optional fields and rejects malformed payload atomically", () => {
  assert.deepEqual(parseCargo("?weight=500&volume=1"), {
    weight: "500",
    volume: "1"
  });
  assert.deepEqual(parseCargo("?weight=1%2C2"), {weight: "1.2"});
  assert.deepEqual(parseCargo("?volume=0.125&accept=accept&cargo=ignored"), {
    volume: "0.125"
  });
  for (const query of [
    "",
    "?weight=",
    "?weight=0&volume=1",
    "?weight=500&volume=invalid",
    "?weight=500&weight=500&volume=1",
    "?volume=1&volume=2",
    "?weight=%3Cimg%3E",
    "?volume=Infinity",
    "?weight=1.01",
    "?volume=0.0001"
  ]) {
    assert.equal(parseCargo(query), null, query);
  }
});

test("cargo transfer: fill empty fields, preserve matching format and do not touch unrelated data", () => {
  const form = makeForm({cargo: "synthetic", "cargo-qty": "3"});
  assert.equal(applyCargo(form, {weight: "500", volume: "1.25"}), "apply");
  assert.equal(form.elements["cargo-weight"].value, "500");
  assert.equal(form.elements["cargo-volume"].value, "1,25");
  assert.equal(form.elements.cargo.value, "synthetic");
  assert.equal(form.elements["cargo-qty"].value, "3");
  assert.equal(form.elements.accept.checked, false);
  assert.deepEqual(form.events, ["change"]);
  form.elements["cargo-weight"].value = "500,00";
  form.elements["cargo-volume"].value = "1,2500";
  assert.equal(applyCargo(form, {weight: "500", volume: "1.25"}), "same");
  assert.equal(form.elements["cargo-weight"].value, "500,00");
  assert.equal(form.elements["cargo-volume"].value, "1,2500");
  assert.deepEqual(form.events, ["change"]);
  const partial = makeForm({"cargo-weight": "500"});
  assert.equal(applyCargo(partial, {weight: "500", volume: "1"}), "apply");
  assert.equal(partial.elements["cargo-volume"].value, "1");
  const one = makeForm({"cargo-volume": "7"});
  applyCargo(one, {weight: "500"});
  assert.equal(one.elements["cargo-volume"].value, "7");
});

test("cargo transfer: conflicting saved parameters are never partially overwritten", () => {
  const form = makeForm({"cargo-weight": "100"});
  assert.equal(applyCargo(form, {weight: "500", volume: "1"}), "conflict");
  assert.equal(form.elements["cargo-weight"].value, "100");
  assert.equal(form.elements["cargo-volume"].value, "");
  assert.equal(form.notice.hidden, false);
  assert.match(form.notice.textContent, /сохранены другие вес или объём/);
  assert.equal(form.events.length, 0);
});

test("cargo transfer: route conflict or invalid pair blocks cargo prefill too", () => {
  const conflict = makeForm({"loading-place": "khb", "unloading-place": "vvo"});
  applyOrderPrefill(conflict, base + "&weight=500&volume=1", tariffs);
  assert.equal(conflict.elements["cargo-weight"].value, "");
  assert.equal(conflict.elements["loading-place"].value, "khb");
  assert.equal(conflict.notice.hidden, false);
  const invalid = makeForm();
  applyOrderPrefill(
    invalid,
    "?origin=invalid&destination=khb&weight=500&volume=1",
    tariffs
  );
  assert.equal(invalid.elements["cargo-weight"].value, "");
  applyOrderPrefill(invalid, "?weight=500&volume=1", tariffs);
  assert.equal(invalid.elements["cargo-weight"].value, "");
  const empty = makeForm();
  applyOrderPrefill(empty, base + "&weight=500&volume=1", tariffs);
  assert.equal(empty.elements["loading-place"].value, "vvo");
  assert.equal(empty.elements["cargo-weight"].value, "500");
  assert.equal(empty.elements["cargo-volume"].value, "1");
  assert.equal(empty.elements.accept.checked, false);
  const matching = makeForm({"loading-place": "vvo", "unloading-place": "khb"});
  applyOrderPrefill(matching, base + "&weight=500", tariffs);
  assert.equal(matching.elements["cargo-weight"].value, "500");
  assert.equal(matching.elements["cargo-volume"].value, "");
});
