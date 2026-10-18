/* eslint-disable sonarjs/no-duplicate-string -- Explicit URLs clarify sharing scenarios. */
import {test} from "node:test";
import {strict as assert} from "node:assert";
import {
  buildCalculatorShareUrl,
  parseCalculatorShare,
  applyCalculatorShare,
  initCalculatorShare
} from "../src/js/common/calculator-share.js";

const tariffs = {
  places: {vvo: "Владивосток", khb: "Хабаровск"},
  heavyCargoPrices: [{price: {vvo: {khb: 11}}}]
};
const href = "https://bergvl.ru/calculator.html?utm_source=test#result";
const input = {
  origin: "vvo",
  destination: "khb",
  weight: "12,5",
  volume: "0,125",
  params: ["ic-engine", "fridge", "oversized"]
};

test("calculator share: round trip preserves inputs and options, not price or tracking", () => {
  const url = new URL(buildCalculatorShareUrl(href, tariffs, input));
  assert.equal(url.pathname, "/calculator.html");
  assert.equal(url.hash, "");
  assert.equal(url.searchParams.has("utm_source"), false);
  assert.deepEqual(parseCalculatorShare(url.search, tariffs), {
    ...input,
    weight: "12.5",
    volume: "0.125"
  });
  for (const field of ["weight", "volume"]) {
    const partial = {...input, [field]: "", params: []};
    const link = new URL(buildCalculatorShareUrl(href, tariffs, partial));
    assert.equal(link.searchParams.has(field), false);
    assert.deepEqual(parseCalculatorShare(link.search, tariffs), {
      ...partial,
      weight: field === "weight" ? "" : "12.5",
      volume: field === "volume" ? "" : "0.125"
    });
  }
});

test("calculator share: invalid and duplicate parameters rejected", () => {
  const base = "?share=1&origin=vvo&destination=khb&weight=12.5";
  for (const search of [
    "",
    base.replace("share=1", "share=2"),
    base.replace("vvo", "unknown"),
    base.replace("khb", "vvo"),
    base + "&weight=1",
    base + "&volume=0",
    base + "&volume=Infinity",
    base + "&params=unknown",
    base + "&params=fridge&params=fridge",
    base + "&share=1",
    base.replace("12.5", "%3Cscript%3E"),
    base.replace("&weight=12.5", "")
  ])
    assert.equal(parseCalculatorShare(search, tariffs), null, search);
  for (const patch of [
    {weight: "", volume: ""},
    {weight: "0"},
    {volume: "1.2345"},
    {destination: "vvo"},
    {origin: "unknown"}
  ])
    assert.equal(
      buildCalculatorShareUrl(href, tariffs, {...input, ...patch}),
      null
    );
});

test("calculator share: prefill replaces all shared fields, clears absent values and flags", () => {
  const checkboxes = input.params.map((value) => ({value, checked: true}));
  const form = {
    elements: Object.fromEntries(
      ["origin", "destination", "weight", "volume"].map((name) => [
        name,
        {value: "old"}
      ])
    ),
    querySelectorAll: () => checkboxes
  };
  applyCalculatorShare(form, {
    ...input,
    weight: "12.5",
    volume: "",
    params: ["fridge"]
  });
  assert.equal(form.elements.weight.value, "12,5");
  assert.equal(form.elements.volume.value, "");
  assert.equal(form.elements.origin.value, "vvo");
  assert.deepEqual(
    checkboxes.map((item) => item.checked),
    [false, true, false]
  );
});

function fixture(navigator, url = "https://bergvl.ru/calculator.html?share=1") {
  let click;
  const button = {
    hidden: true,
    disabled: false,
    addEventListener: (_, fn) => {
      click = fn;
    }
  };
  const status = {textContent: ""};
  const fallback = {
    hidden: true,
    focus() {
      this.focused = true;
    },
    select() {
      this.selected = true;
    }
  };
  const elements = [button, status, fallback];
  const form = {querySelector: () => elements.shift()};
  initCalculatorShare(form, {navigator}, () => url);
  return {button, status, fallback, click: () => click()};
}

test("calculator share: native menu, cancellation, clipboard and manual fallback", async () => {
  let shared;
  const native = fixture({
    share: async (data) => {
      shared = data;
    }
  });
  assert.equal(native.button.hidden, false);
  await native.click();
  assert.match(shared.url, /share=1/);
  assert.equal(native.button.disabled, false);
  const cancelled = fixture({
    share: async () => {
      throw Object.assign(new Error("Cancelled"), {name: "AbortError"});
    }
  });
  await cancelled.click();
  assert.equal(cancelled.fallback.hidden, true);
  assert.equal(cancelled.status.textContent, "");
  let copied;
  const clipboard = fixture({
    clipboard: {
      writeText: async (url) => {
        copied = url;
      }
    }
  });
  await clipboard.click();
  assert.match(copied, /share=1/);
  assert.match(clipboard.status.textContent, /скопирована/);
  const failed = fixture({
    share: async () => {
      throw new Error("Denied");
    }
  });
  await failed.click();
  assert.equal(failed.fallback.hidden, false);
  assert.equal(failed.fallback.selected, true);
  assert.match(failed.fallback.value, /share=1/);
  assert.equal(failed.button.disabled, false);
  const invalid = fixture({}, null);
  await invalid.click();
  assert.match(invalid.status.textContent, /Выберите направление/);
  assert.equal(invalid.fallback.hidden, true);
});
