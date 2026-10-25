import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import {setImmediate} from "node:timers/promises";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const headerOptions = () => {
  const html = read("../public/home.html");
  const selector = html.match(
    /<select[^>]*id="contacts__place-selector"[^>]*>([\s\S]*?)<\/select>/
  )[1];
  return [
    ...selector.matchAll(
      /<option[^>]*data-city="([^"]+)"[^>]*>([^<]+)<\/option>/g
    )
  ].map(([, code, value]) => ({value, dataset: {city: code}}));
};

test("Background city: header renders codes from the existing city directory", () => {
  assert.deepEqual(
    headerOptions().map((option) => option.dataset.city),
    ["vvo", "uss", "khb", "blg"]
  );
  assert.match(
    read("../src/pug/header.pug"),
    /option\(data-city=code, selected=idx === 0\)=tariffs.places\[code\]/
  );
});

for (const blockedStorage of [false, true]) {
  test(`Background city: header and detection stay synchronized, storage blocked=${blockedStorage}`, async () => {
    const listeners = {};
    const page = {dataset: {}};
    const options = headerOptions();
    const select = {
      value: "Владивосток",
      style: {},
      get selectedOptions() {
        return options.filter((option) => option.value === this.value);
      },
      addEventListener: (name, callback) => {
        listeners[name] = callback;
      }
    };
    let stored = "Хабаровск";
    const sandbox = {
      setPlace: async () => "Уссурийск",
      consentEvent: "privacy",
      hasAdditionalConsent: () => false,
      localStorage: {
        getItem() {
          if (blockedStorage) throw new Error("Storage denied");
          return stored;
        },
        setItem(key, value) {
          if (blockedStorage) throw new Error("Storage denied");
          stored = value;
        }
      },
      document: {
        body: page,
        getElementById: (id) =>
          id === "contacts__place-selector"
            ? select
            : {querySelectorAll: () => []}
      },
      window: {addEventListener() {}}
    };
    vm.runInNewContext(
      read("../src/js/index.js").replace(/^import[^\n]+\n/gm, ""),
      sandbox
    );
    await setImmediate();
    assert.equal(page.dataset.city, "uss");
    assert.equal(select.value, "Уссурийск");
    for (const option of options) {
      select.value = option.value;
      listeners.change({target: select});
      assert.equal(page.dataset.city, option.dataset.city);
    }
    // The selected option is the source, not a second name-to-code lookup.
    options[0].dataset.city = "custom-code";
    sandbox.renderCity(options[0].value);
    assert.equal(page.dataset.city, "custom-code");
    sandbox.renderCity("Unknown city");
    assert.equal(page.dataset.city, "vvo");
  });
}

test("Background city: geometry profiles do not override theme colors", () => {
  const style = read("../src/less/layout.less");
  for (const code of ["uss", "khb", "blg"]) {
    const profile = style.match(
      new RegExp(`\\.page\\[data-city="${code}"\\]\\s*\\{([^}]+)\\}`)
    )[1];
    assert.match(profile, /--beam-angle-1:/);
    assert.match(profile, /--beam-period-1: \d+px/);
    assert.doesNotMatch(profile, /--beam-(?:light|edge|haze|accent):/);
  }
  assert.match(style, /\.page::before\s*\{[^}]*position: absolute/);
  assert.doesNotMatch(style, /position: fixed|animation:/);
});
