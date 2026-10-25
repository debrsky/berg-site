import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {setImmediate} from "node:timers/promises";

const defaultCity = "Владивосток";
const manualCity = "Благовещенск";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

function cityPage({initial = {}, blocked = false, pending = false} = {}) {
  const values = {...initial};
  const events = {};
  const requests = [];
  let allowed = false;
  let resolveRequest;
  const select = {
    value: defaultCity,
    style: {},
    selectedOptions: [{dataset: {city: "test"}}],
    addEventListener: (name, handler) => {
      events[name] = handler;
    }
  };
  const scope = {
    suggestionToken: "test",
    consentEvent: "privacy",
    hasAdditionalConsent: () => allowed,
    localStorage: {
      getItem(key) {
        if (blocked) throw Error("blocked");
        return values[key] ?? null;
      },
      setItem(key, value) {
        if (blocked) throw Error("blocked");
        values[key] = value;
      }
    },
    fetch: async (url) => {
      requests.push(url);
      if (pending)
        await new Promise((resolve) => {
          resolveRequest = resolve;
        });
      return {
        ok: true,
        json: async () => ({
          location: {data: {city: "Хабаровск", region: "Хабаровский"}}
        })
      };
    },
    document: {
      body: {dataset: {}},
      getElementById: (id) =>
        id === "contacts__place-selector"
          ? select
          : {querySelectorAll: () => []}
    },
    window: {
      addEventListener: (name, handler) => {
        events[name] = handler;
      }
    }
  };
  const stripImports = (source) => source.replace(/^import[^\n]+\n/gm, "");
  runInNewContext(
    stripImports(read("../src/js/common/set-place.js")).replace(
      "export const",
      "const"
    ) +
      "\n" +
      stripImports(read("../src/js/index.js")),
    scope
  );
  return {
    select,
    requests,
    values,
    accept() {
      allowed = true;
      events.privacy();
    },
    choose(city) {
      select.value = city;
      events.change({target: select});
    },
    resolve: () => resolveRequest()
  };
}

test("City consent: default city is not saved and acceptance starts detection", async () => {
  const page = cityPage();
  await setImmediate();
  assert.equal(page.select.value, defaultCity);
  assert.equal(page.values.userPlace, undefined);
  assert.equal(page.requests.length, 0);
  page.accept();
  await setImmediate();
  assert.equal(page.requests.length, 1);
  assert.equal(page.select.value, "Хабаровск");
  assert.equal(page.values.userPlaceSource, "detected");
});

test("City consent: legacy or automatically cached Vladivostok does not block detection", async () => {
  for (const source of [undefined, "detected"]) {
    const page = cityPage({
      initial: {
        userPlace: defaultCity,
        userPlaceSource: source
      }
    });
    await setImmediate();
    assert.equal(page.requests.length, 0);
    page.accept();
    await setImmediate();
    assert.equal(page.select.value, "Хабаровск");
    assert.equal(page.requests.length, 1);
  }
});

test("City consent: saved manual selection is preserved without a request", async () => {
  const page = cityPage({
    initial: {
      userPlace: "Уссурийск",
      userPlaceSource: "manual"
    }
  });
  await setImmediate();
  assert.equal(page.select.value, "Уссурийск");
  page.accept();
  await setImmediate();
  assert.equal(page.select.value, "Уссурийск");
  assert.equal(page.requests.length, 0);
});

for (const blocked of [false, true]) {
  test(`City consent: manual selection wins during detection, blocked storage=${blocked}`, async () => {
    const page = cityPage({blocked, pending: true});
    await setImmediate();
    page.accept();
    page.choose(manualCity);
    page.resolve();
    await setImmediate();
    assert.equal(page.select.value, manualCity);
    if (!blocked) {
      assert.equal(page.values.userPlace, manualCity);
      assert.equal(page.values.userPlaceSource, "manual");
    }
  });

  test(`City consent: manual selection before acceptance is preserved, blocked storage=${blocked}`, async () => {
    const page = cityPage({blocked});
    await setImmediate();
    page.choose("Уссурийск");
    page.accept();
    await setImmediate();
    assert.equal(page.select.value, "Уссурийск");
  });
}
