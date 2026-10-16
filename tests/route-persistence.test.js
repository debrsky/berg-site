/* eslint-disable sonarjs/no-duplicate-string -- Field names keep persistence assertions explicit. */
import {test} from "node:test";
import {strict as assert} from "node:assert";
import {
  enablePersistance,
  disablePersistance
} from "../src/js/form/persistance.js";
import {cleanForm, saveForm, restoreSavedForm} from "../src/js/form/utils.js";
import {applyRoute} from "../src/js/common/route.js";
import {applyOrderPrefill} from "../src/js/common/calculator-transfer.js";

function makeForm() {
  const form = new EventTarget();
  form.getAttribute = () => "order";
  const fields = [
    "loading-place",
    "unloading-place",
    "cargo",
    "cargo-weight",
    "cargo-volume",
    "accept"
  ].map((name) => ({
    name,
    value: "",
    checked: false,
    getAttribute: () => name,
    matches: () => name === "accept"
  }));
  form.elements = Object.fromEntries(
    fields.map((field) => [field.name, field])
  );
  form.querySelectorAll = () => fields;
  form.notice = {};
  form.querySelector = () => form.notice;
  return form;
}

test("route form: restore precedes prefill; conflict, clear, last order and storage failures", () => {
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    FormData: globalThis.FormData
  };
  const makeStorage = () => {
    const values = new Map();
    return {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key)
    };
  };
  const storage = makeStorage();
  globalThis.window = {sessionStorage: storage, localStorage: makeStorage()};
  globalThis.document = new EventTarget();
  globalThis.FormData = class {
    constructor(form) {
      this.form = form;
    }

    entries() {
      return Object.entries(this.form.elements)
        .filter(([key, value]) => key !== "accept" || value.checked)
        .map(([key, value]) => [key, value.value])
        [Symbol.iterator]();
    }
  };
  const key = "form[name=order]";
  const names = ["loading-place", "unloading-place"];
  const pair = {origin: "vvo", destination: "khb"};
  const form = makeForm();
  try {
    storage.setItem(
      key,
      JSON.stringify({[names[0]]: "khb", [names[1]]: "vvo", cargo: "synthetic"})
    );
    enablePersistance(form);
    document.addEventListener("DOMContentLoaded", () =>
      applyRoute(form, pair, names)
    );
    document.dispatchEvent(new Event("DOMContentLoaded"));
    assert.equal(form.elements[names[0]].value, "khb");
    assert.equal(form.notice.hidden, false);
    assert.equal(form.elements.cargo.value, "synthetic");
    assert.equal(form.elements.accept.checked, false);
    saveForm(form, {exclude: ["accept"]});
    cleanForm(form);
    assert.equal(form.elements[names[0]].value, "");
    assert.equal(form.elements.cargo.value, "");
    restoreSavedForm(form);
    assert.equal(form.elements[names[0]].value, "khb");
    assert.equal(form.elements.cargo.value, "synthetic");
    disablePersistance(form);

    storage.setItem(key, "{broken");
    const fresh = makeForm();
    enablePersistance(fresh);
    assert.doesNotThrow(() =>
      document.dispatchEvent(new Event("DOMContentLoaded"))
    );
    assert.equal(applyRoute(fresh, pair, names), "apply");
    assert.equal(fresh.elements[names[1]].value, "khb");
    const tariffs = {
      places: {vvo: "Владивосток", khb: "Хабаровск"},
      heavyCargoPrices: [{price: {vvo: {khb: 11}}}]
    };
    const search = "?origin=vvo&destination=khb&weight=500&volume=1";
    applyOrderPrefill(fresh, search, tariffs);
    assert.equal(fresh.elements["cargo-weight"].value, "500");
    assert.equal(JSON.parse(storage.getItem(key))["cargo-volume"], "1");
    fresh.elements["cargo-weight"].value = "100";
    fresh.dispatchEvent(new Event("change"));
    document.dispatchEvent(new Event("DOMContentLoaded"));
    applyOrderPrefill(fresh, search, tariffs);
    assert.equal(fresh.elements["cargo-weight"].value, "100");
    assert.equal(fresh.notice.hidden, false);
    saveForm(fresh);
    cleanForm(fresh);
    assert.equal(fresh.elements["cargo-weight"].value, "");
    restoreSavedForm(fresh);
    assert.equal(fresh.elements["cargo-weight"].value, "100");
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw Error("denied");
      }
    });
    Object.defineProperty(window, "localStorage", {
      get() {
        throw Error("denied");
      }
    });
    assert.doesNotThrow(() => fresh.dispatchEvent(new Event("change")));
    assert.doesNotThrow(() => saveForm(fresh));
    assert.doesNotThrow(() => restoreSavedForm(fresh));
    disablePersistance(fresh);
  } finally {
    Object.assign(globalThis, previous);
  }
});
