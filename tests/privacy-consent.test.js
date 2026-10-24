import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync, readdirSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {
  consentKey,
  consentVersion,
  consentLifetime,
  validConsent,
  getConsent,
  hasAdditionalConsent,
  saveConsent,
  clearAnalyticsStorage
} from "../src/js/common/privacy-consent.js";

function storage(initial = {}) {
  const value = {...initial};
  Object.defineProperties(value, {
    getItem: {value: (key) => value[key] ?? null},
    setItem: {
      value: (key, item) => {
        value[key] = item;
      }
    },
    removeItem: {
      value: (key) => {
        delete value[key];
      }
    }
  });
  return value;
}

function browser(initial = {}) {
  return {
    localStorage: storage(initial),
    sessionStorage: storage(),
    location: {hostname: "bergvl.ru", pathname: "/order.html"}
  };
}

test("privacy: only an explicit, current, unexpired choice enables services", () => {
  const now = Date.now();
  const value = {version: consentVersion, allowed: true, timestamp: now};
  assert.ok(validConsent(value, now));
  for (const invalid of [
    null,
    {},
    {...value, allowed: "true"},
    {...value, version: "old"},
    {...value, timestamp: now + 1},
    {...value, timestamp: now - consentLifetime}
  ])
    assert.equal(validConsent(invalid, now), false);
  const scope = browser();
  assert.equal(hasAdditionalConsent(scope), false);
  saveConsent(false, scope);
  assert.equal(hasAdditionalConsent(scope), false);
  saveConsent(true, scope);
  assert.equal(hasAdditionalConsent(scope), true);
  assert.equal(getConsent(scope).version, consentVersion);
});

test("privacy: blocked or malformed storage fails closed and choice works in memory", () => {
  assert.equal(getConsent(browser({[consentKey]: "{broken"})), null);
  const scope = browser();
  Object.defineProperty(scope, "localStorage", {
    get() {
      throw Error("blocked");
    }
  });
  assert.equal(hasAdditionalConsent(scope), false);
  assert.doesNotThrow(() => saveConsent(true, scope));
  assert.equal(hasAdditionalConsent(scope), true);
});

test("privacy: withdrawal removes accessible Metrika storage, not orders or settings", () => {
  const scope = browser({
    _ym_uid: "test",
    theme: "dark",
    "form[name=order]": "order"
  });
  scope.sessionStorage.setItem("_ym_retryReqs", "test");
  const writes = [];
  const page = {
    get cookie() {
      return "_ym_uid=test; other=keep";
    },
    set cookie(value) {
      writes.push(value);
    }
  };
  clearAnalyticsStorage(scope, page);
  assert.equal(scope.localStorage.getItem("_ym_uid"), null);
  assert.equal(scope.sessionStorage.getItem("_ym_retryReqs"), null);
  assert.equal(scope.localStorage.getItem("theme"), "dark");
  assert.equal(scope.localStorage.getItem("form[name=order]"), "order");
  assert.ok(writes.some((value) => value.includes("domain=.bergvl.ru")));
  assert.ok(writes.every((value) => value.startsWith("_ym_uid=")));
});

const directory = new URL("../public/", import.meta.url);
const read = (name) => readFileSync(new URL(name, directory), "utf8");

test("privacy: all standard and landing pages share the banner without eager beacons", () => {
  for (const name of readdirSync(directory).filter((file) =>
    file.endsWith(".html")
  )) {
    const html = read(name);
    if (!/js\/(?:index|landing)\.js/.test(html)) continue;
    assert.equal(html.split('src="js/privacy.js"').length - 1, 1, name);
    assert.match(html, /data-privacy-banner/);
    const bannerTag = html.match(/<section class="privacy-banner"[^>]*>/)?.[0];
    assert.ok(bannerTag, name);
    assert.doesNotMatch(bannerTag, /role="region"/);
    assert.match(bannerTag, /aria-labelledby="privacy-banner-title"/);
    assert.match(html, /data-privacy-open/);
    assert.match(html, /href="service-consent.html"/);
    assert.doesNotMatch(
      html,
      /(?:src|href)="https:\/\/(?:mc\.yandex|suggestions\.dadata)/
    );
    assert.doesNotMatch(html, /webvisor:true|webvisor: true/);
  }
});

function controller(initial) {
  const events = {};
  const handlers = {};
  const requests = [];
  let reloads = 0;
  let focused = false;
  const accept = {
    addEventListener: (_, fn) => {
      handlers.accept = fn;
    },
    focus() {}
  };
  const reject = {
    addEventListener: (_, fn) => {
      handlers.reject = fn;
    }
  };
  const close = {
    hidden: true,
    addEventListener: (_, fn) => {
      handlers.close = fn;
    }
  };
  const opener = {
    hidden: true,
    addEventListener: (_, fn) => {
      handlers.open = fn;
    },
    focus: () => {
      focused = true;
    }
  };
  const banner = {
    hidden: true,
    querySelector: (selector) => {
      if (selector.includes("close")) return close;
      return selector.includes("accept") ? accept : reject;
    }
  };
  const scope = browser(initial ? {[consentKey]: JSON.stringify(initial)} : {});
  scope.location.reload = () => {
    reloads++;
  };
  scope.addEventListener = (name, fn) => {
    events[name] = fn;
  };
  scope.dispatchEvent = () => {};
  const page = {
    querySelector: () => banner,
    querySelectorAll: () => [opener],
    body: {classList: {contains: () => false}},
    createElement: () => ({}),
    head: {append: (script) => requests.push(script.src)},
    cookie: ""
  };
  runInNewContext(read("js/privacy.js"), {
    window: scope,
    document: page,
    CustomEvent: class {
      constructor(name, options) {
        this.detail = options.detail;
      }
    }
  });
  return {
    banner,
    handlers,
    scope,
    requests,
    events,
    opener,
    close,
    reloads: () => reloads,
    focused: () => focused
  };
}

test("privacy controller: first visit and rejection send no requests", () => {
  const ui = controller();
  assert.equal(ui.banner.hidden, false);
  assert.deepEqual(ui.requests, []);
  assert.equal(ui.scope.ym, undefined);
  ui.handlers.reject();
  assert.equal(ui.banner.hidden, true);
  assert.deepEqual(ui.requests, []);
  assert.equal(ui.reloads(), 0);
  assert.equal(getConsent(ui.scope).allowed, false);
});

test("privacy controller: acceptance loads one tracker, reopening supports withdrawal", () => {
  const ui = controller();
  ui.handlers.accept();
  assert.deepEqual(ui.requests, ["https://mc.yandex.ru/metrika/tag.js"]);
  assert.equal(ui.scope.ym.a.length, 1);
  ui.handlers.open({currentTarget: ui.opener});
  assert.equal(ui.banner.hidden, false);
  ui.handlers.accept();
  assert.equal(ui.requests.length, 1);
  ui.handlers.reject();
  assert.equal(ui.reloads(), 1);
  assert.equal(getConsent(ui.scope).allowed, false);
  assert.equal(ui.focused(), true);
});

test("privacy controller: remembered refusal and expired permission never load services", () => {
  for (const choice of [
    {version: consentVersion, allowed: false, timestamp: Date.now()},
    {
      version: consentVersion,
      allowed: true,
      timestamp: Date.now() - consentLifetime
    }
  ]) {
    const ui = controller(choice);
    assert.deepEqual(ui.requests, []);
    assert.equal(ui.banner.hidden, !choice.allowed);
  }
});

test("privacy controller: first-time or expired choices cannot be dismissed", () => {
  for (const choice of [
    undefined,
    {
      version: consentVersion,
      allowed: true,
      timestamp: Date.now() - consentLifetime
    }
  ]) {
    const ui = controller(choice);
    ui.handlers.open({currentTarget: ui.opener});
    assert.equal(ui.close.hidden, true);
    ui.handlers.close();
    ui.events.keydown({key: "Escape"});
    assert.equal(ui.banner.hidden, false);
    assert.equal(ui.reloads(), 0);
    assert.equal(getConsent(ui.scope), null);
  }
});

test("privacy controller: close and Escape preserve an existing decision", () => {
  for (const allowed of [true, false]) {
    const choice = {version: consentVersion, allowed, timestamp: Date.now()};
    const ui = controller(choice);
    const stored = ui.scope.localStorage.getItem(consentKey);
    const requestCount = ui.requests.length;
    ui.handlers.open({currentTarget: ui.opener});
    assert.equal(ui.close.hidden, false);
    ui.handlers.close();
    assert.equal(ui.banner.hidden, true);
    assert.equal(ui.focused(), true);
    ui.handlers.open({currentTarget: ui.opener});
    let prevented = false;
    ui.events.keydown({
      key: "Escape",
      preventDefault: () => {
        prevented = true;
      }
    });
    assert.equal(prevented, true);
    assert.equal(ui.banner.hidden, true);
    assert.equal(ui.scope.localStorage.getItem(consentKey), stored);
    assert.equal(ui.requests.length, requestCount);
    assert.equal(ui.reloads(), 0);
  }
});

test("privacy controller: another tab's change reloads the active page", () => {
  const ui = controller();
  ui.events.storage({key: consentKey});
  assert.equal(ui.reloads(), 1);
  ui.events.storage({key: "theme"});
  assert.equal(ui.reloads(), 1);
});
