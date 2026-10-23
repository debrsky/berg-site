import assert from "node:assert/strict";
import test from "node:test";
import {generateInvoice} from "../src/js/client-doc/invoice.js";

function getUnit(item) {
  const {html} = generateInvoice({details: [item]});
  const row = html.match(
    /<td class="doc-text-center">1<\/td>\s*<td>.*?<\/td>\s*<td class="doc-text-center">(.*?)<\/td>/s
  );
  assert.ok(row);
  return row[1];
}

test("invoice adds trip explanation for the standalone word regardless of case", () => {
  for (const name of [
    "Перевозка: рейс",
    "РЕЙС Владивосток — Хабаровск",
    "Перевозка (рейс)"
  ]) {
    assert.equal(getUnit({name, mU: "усл."}), "усл. (рейс)");
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
    assert.equal(getUnit({name, mU: "кг"}), "кг");
  }
});

test("invoice handles missing units and does not mutate source data", () => {
  const item = {name: "Рейс"};
  assert.equal(getUnit(item), "(рейс)");
  assert.deepEqual(item, {name: "Рейс"});
  assert.equal(getUnit({name: "Перевозка"}), "");
});
