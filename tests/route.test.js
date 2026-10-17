import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import {
  parseRoute,
  prefillDecision,
  applyRoute,
  validContext,
  contextTTL,
  rememberRoute,
  trackRouteClick,
  trackRouteSuccess
} from "../src/js/common/route.js";
import {readStorage, writeStorage} from "../src/js/common/storage.js";
import {calculateCargo} from "../src/js/common/calculate.js";

const source = readFileSync(
  new URL("../src/pug/tariffs.pug", import.meta.url),
  "utf8"
);
const tariffs = vm.runInNewContext(
  source.slice(source.indexOf("  const tariffs")) + "; tariffs;"
);
const pairs = [
  ["vvo", "khb"],
  ["khb", "vvo"],
  ["vvo", "blg"]
];

test("route query: valid pairs and only cities accepted; invalid input ignored atomically", () => {
  for (const [origin, destination] of pairs) {
    assert.deepEqual(
      parseRoute(
        `?origin=${origin}&destination=${destination}&weight=900&accept=accept&yclid=test`,
        tariffs
      ),
      {origin, destination}
    );
  }
  for (const query of [
    "",
    "?origin=vvo",
    "?destination=khb",
    "?origin=&destination=khb",
    "?origin=vvo&origin=vvo&destination=khb",
    "?origin=vvo&destination=khb&destination=blg",
    "?origin=vvo&destination=vvo",
    "?origin=other&destination=khb",
    "?origin=VVO&destination=khb",
    "?origin=vvo&destination=uss",
    "?origin=__proto__&destination=khb",
    "?origin=%3Cscript%3E&destination=khb"
  ])
    assert.equal(parseRoute(query, tariffs), null, query);
});

test("route prefill: empty, same, conflicting and partially restored pair", () => {
  const pair = {origin: "vvo", destination: "khb"};
  const loading = "loading-place";
  const names = [loading, "unloading-place"];
  assert.equal(prefillDecision(pair, "", ""), "apply");
  assert.equal(prefillDecision(pair, "vvo", "khb"), "same");
  assert.equal(prefillDecision(pair, "khb", "vvo"), "conflict");
  assert.equal(prefillDecision(pair, "vvo", ""), "conflict");
  assert.equal(prefillDecision(pair, "", "khb"), "conflict");
  assert.equal(prefillDecision(null, "", ""), "ignore");
  const notice = {};
  const events = [];
  const form = {
    elements: {
      [loading]: {value: ""},
      "unloading-place": {value: ""},
      accept: {checked: false}
    },
    querySelector: () => notice,
    dispatchEvent: (event) => events.push(event.type)
  };
  assert.equal(applyRoute(form, pair, names), "apply");
  assert.deepEqual(events, ["change"]);
  assert.equal(form.elements.accept.checked, false);
  form.elements[loading].value = "blg";
  assert.equal(applyRoute(form, pair, names), "conflict");
  assert.equal(form.elements[loading].value, "blg");
  assert.equal(notice.hidden, false);
});

test("route analytics: sanitized click, last-click, TTL, success consumed once and storage optional", () => {
  const savedWindow = globalThis.window;
  const values = new Map();
  const calls = [];
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
  globalThis.window = {
    sessionStorage: storage,
    ym: (...args) => calls.push(args)
  };
  try {
    const click = (routeId, routeGoal = "calculator", ctaPosition = "hero") =>
      trackRouteClick({
        dataset: {
          routeId,
          routeGoal,
          ctaPosition,
          email: "not-to-send"
        }
      });
    click("vvo-khb");
    click("khb-vvo", "order");
    click("arbitrary");
    trackRouteSuccess();
    trackRouteSuccess();
    assert.equal(calls.length, 3);
    assert.deepEqual(calls[2], [
      87156585,
      "reachGoal",
      "route_order_success",
      {
        route_id: "khb-vvo",
        source_page: "khabarovsk-vladivostok"
      }
    ]);
    const now = Date.now();
    const context = {
      route_id: "vvo-khb",
      source_page: "vladivostok-khabarovsk",
      time: now
    };
    assert.equal(validContext(context, now + contextTTL - 1), true);
    assert.equal(validContext(context, now + contextTTL), false);
    assert.equal(validContext(context, now - 1), false);
    assert.equal(
      validContext({...context, source_page: "https://untrusted"}),
      false
    );
    rememberRoute("vvo-khb", now - contextTTL);
    trackRouteSuccess();
    assert.equal(calls.length, 3);
    click("vvo-khb", "calculator", "mobile");
    assert.deepEqual(calls[3], [
      87156585,
      "reachGoal",
      "route_calculator_click",
      {route_id: "vvo-khb", cta_position: "mobile"}
    ]);
    window.ym = () => {
      throw Error("blocked");
    };
    assert.doesNotThrow(() => click("vvo-khb"));
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw Error("blocked");
      }
    });
    assert.doesNotThrow(() => rememberRoute("vvo-khb"));
    assert.doesNotThrow(() => trackRouteSuccess());
    assert.equal(readStorage("sessionStorage", "test"), null);
    assert.doesNotThrow(() => writeStorage("sessionStorage", "test", {}));
  } finally {
    globalThis.window = savedWindow;
  }
});

test("shared calculator: nine examples, boundaries, special flags, machine trip", () => {
  const examples = [
    [10, 0.1, [550, 350, 850]],
    [500, 1, [5500, 3500, 8500]],
    [100, 1, [2200, 1400, 3400]]
  ];
  for (const [weight, volume, amounts] of examples) {
    pairs.forEach(([origin, destination], idx) => {
      const result = calculateCargo(tariffs, {
        weight,
        volume,
        origin,
        destination,
        params: []
      });
      assert.equal(result.amount, amounts[idx]);
    });
  }
  const calc = (weight, volume, params = []) =>
    calculateCargo(tariffs, {
      weight,
      volume,
      origin: "vvo",
      destination: "khb",
      params
    });
  assert.equal(calc(1000, 1).amount, 10000);
  assert.equal(calc(100, 5).amount, 10000);
  assert.equal(calc(100, 0.5).amount, 1100);
  assert.equal(calc(500, 1, ["oversized"]).amount, 7150);
  assert.equal(calc(10, 0.1, ["ic-engine"]).amount, 2000);
  assert.equal(calc(500, 1, ["fridge"]).amount, 9500);
  assert.equal(calc(15000, 1).limit, Infinity);
  assert.equal(calc(100, 75).limit, Infinity);
  assert.equal(calc(0, 1), null);
});
