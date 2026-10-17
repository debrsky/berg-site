import {test} from "node:test";
import {strict as assert} from "node:assert";
import {
  prepareRouteNavigation,
  parseNavigationContext,
  restoreRouteNavigation
} from "../src/js/common/route-navigation.js";
import {
  contextKey,
  contextTTL,
  trackRouteSuccess
} from "../src/js/common/route.js";

const routeId = "vvo-khb";
const now = 1792000000000;
const contextQuery = `?route_source=${routeId}&route_time=${now}`;

test("route navigation: source contains only whitelisted route and original click time", () => {
  assert.deepEqual(parseNavigationContext(contextQuery, now), {
    route_id: routeId,
    source_page: "vladivostok-khabarovsk",
    time: now
  });
  assert.equal(
    parseNavigationContext(contextQuery, now + contextTTL - 1).time,
    now
  );
  assert.equal(parseNavigationContext(contextQuery, now + contextTTL), null);
  assert.equal(parseNavigationContext(contextQuery, now - 1), null);
  for (const query of [
    "?route_source=vvo-khb",
    "?route_time=" + now,
    contextQuery + "&route_source=vvo-khb",
    contextQuery + "&route_time=" + now,
    "?route_source=unknown&route_time=" + now,
    "?route_source=__proto__&route_time=" + now,
    "?route_source=vvo-khb&route_time=Infinity",
    "?route_source=vvo-khb&route_time=1e12"
  ])
    assert.equal(parseNavigationContext(query, now), null);
});

test("route navigation: decorate only new-tab calculator/order links without copying landing query", () => {
  const previous = globalThis.window;
  globalThis.window = {
    location: {
      origin: "https://bergvl.ru",
      href: "https://bergvl.ru/vladivostok-khabarovsk.html?utm_source=not-to-copy&yclid=not-to-copy"
    }
  };
  try {
    const makeLink = (href = "calculator.html?origin=vvo&destination=khb") => ({
      target: "_blank",
      href,
      dataset: {routeId, routeGoal: "calculator", ctaPosition: "hero"}
    });
    const link = makeLink();
    prepareRouteNavigation(link, now);
    const url = new URL(link.href);
    assert.equal(url.searchParams.get("origin"), "vvo");
    assert.equal(url.searchParams.get("destination"), "khb");
    assert.equal(url.searchParams.get("route_source"), routeId);
    assert.equal(url.searchParams.get("route_time"), String(now));
    assert.equal(url.searchParams.has("utm_source"), false);
    assert.equal(url.searchParams.has("yclid"), false);
    const mobile = makeLink();
    mobile.dataset.ctaPosition = "mobile";
    prepareRouteNavigation(mobile, now);
    assert.equal(
      new URL(mobile.href).searchParams.get("route_source"),
      routeId
    );
    for (const href of [
      "https://example.com/calculator.html",
      "privacy-policy.html",
      "tel:+79243304405"
    ]) {
      const excluded = makeLink(href);
      prepareRouteNavigation(excluded, now);
      assert.equal(excluded.href, href);
    }
    const sameTab = {...makeLink(), target: ""};
    const original = sameTab.href;
    prepareRouteNavigation(sameTab, now);
    assert.equal(sameTab.href, original);
  } finally {
    globalThis.window = previous;
  }
});

test("route navigation: fresh noopener tab restores context, respects newer source and consumes success", () => {
  const previous = globalThis.window;
  const values = new Map();
  const calls = [];
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key)
    },
    ym: (...args) => calls.push(args)
  };
  try {
    const currentTime = Date.now();
    const search = `?route_source=${routeId}&route_time=${currentTime}`;
    restoreRouteNavigation(search, currentTime);
    assert.equal(JSON.parse(values.get(contextKey)).route_id, routeId);
    trackRouteSuccess();
    trackRouteSuccess();
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0][3], {
      route_id: routeId,
      source_page: "vladivostok-khabarovsk"
    });
    const newer = {
      route_id: "khb-vvo",
      source_page: "khabarovsk-vladivostok",
      time: currentTime + 1
    };
    values.set(contextKey, JSON.stringify(newer));
    restoreRouteNavigation(search, currentTime + 2);
    assert.deepEqual(JSON.parse(values.get(contextKey)), newer);
    values.clear();
    restoreRouteNavigation(contextQuery, now + contextTTL);
    assert.equal(values.has(contextKey), false);
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw Error("blocked");
      }
    });
    assert.doesNotThrow(() => restoreRouteNavigation(search, currentTime));
  } finally {
    globalThis.window = previous;
  }
});
