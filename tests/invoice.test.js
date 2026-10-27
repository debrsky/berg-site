import assert from "node:assert/strict";
import test from "node:test";
import {generateInvoice} from "../src/js/client-doc/invoice.js";

test("invoice omits the basis even when application data is provided", () => {
  const {html} = generateInvoice({
    app: {
      nomer: "APPLICATION-123",
      base_code: "VL",
      date_reg: "01.01.2026",
      cargo: "TEST-CARGO",
      weight: 100,
      volume: 2,
      count_pcs: 3
    }
  });
  assert.doesNotMatch(html, /Основание|APPLICATION-123|TEST-CARGO/);
});

function getUnit(item) {
  const {html} = generateInvoice({details: [item]});
  const row = html.match(
    /<td class="doc-text-center">1<\/td>\s*<td>.*?<\/td>\s*<td class="doc-text-center">(.*?)<\/td>/s
  );
  assert.ok(row);
  return row[1];
}

test("invoice adds trip explanation to pieces for the standalone word regardless of case", () => {
  for (const name of [
    "Перевозка: рейс",
    "РЕЙС Владивосток — Хабаровск",
    "Перевозка (рейс)"
  ]) {
    assert.equal(getUnit({name, mU: "шт"}), "шт (рейс)");
  }
});

test("invoice leaves units unchanged for other services and partial matches", () => {
  for (const name of [
    "Перевозка груза",
    "Машинорейс",
    "Рейсы",
    "рейсовый",
    "авиарейс",
    "рейс1",
    undefined
  ]) {
    assert.equal(getUnit({name, mU: "шт"}), "шт");
  }
});

test("invoice leaves non-piece units unchanged even for trips", () => {
  for (const mU of ["усл.", "кг", "т", "", null, undefined]) {
    assert.equal(getUnit({name: "Рейс", mU}), mU ?? "");
  }
});

test("invoice handles missing units and does not mutate source data", () => {
  const item = {name: "Рейс"};
  assert.equal(getUnit(item), "");
  assert.deepEqual(item, {name: "Рейс"});
  assert.equal(getUnit({name: "Перевозка"}), "");
});
