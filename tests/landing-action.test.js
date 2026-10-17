import {test} from "node:test";
import {strict as assert} from "node:assert";
import {initLandingAction} from "../src/js/common/landing-action.js";

function fixture() {
  const action = {hidden: true};
  const hero = {};
  const tariff = {};
  const bottom = {};
  const footer = {};
  const observed = [];
  let notify;
  const root = {
    querySelector: (selector) =>
      selector === ".route-landing__mobile-action" ? action : hero,
    querySelectorAll: () => [hero, tariff, bottom, footer]
  };
  class Observer {
    constructor(callback) {
      notify = callback;
    }

    observe(element) {
      observed.push(element);
    }
  }
  const send = (target, isIntersecting, bottom = -1) =>
    notify([{target, isIntersecting, boundingClientRect: {bottom}}]);
  return {action, hero, tariff, bottom, footer, root, Observer, observed, send};
}

test("landing action: appears only after the hero CTA has scrolled above the viewport", () => {
  const f = fixture();
  initLandingAction(f.root, f.Observer);
  assert.equal(f.observed.length, 4);
  f.send(f.hero, false, 1200);
  assert.equal(f.action.hidden, true, "hero still below viewport");
  f.send(f.hero, true, 200);
  assert.equal(f.action.hidden, true, "hero visible");
  f.send(f.hero, false);
  assert.equal(f.action.hidden, false, "hero passed");
  f.send(f.hero, true, 20);
  assert.equal(f.action.hidden, true, "scrolling back to hero");
});

test("landing action: avoids duplicating other CTAs and covering footer controls", () => {
  const f = fixture();
  initLandingAction(f.root, f.Observer);
  f.send(f.hero, false);
  for (const element of [f.tariff, f.bottom, f.footer]) {
    f.send(element, true, 400);
    assert.equal(f.action.hidden, true);
    f.send(element, false);
    assert.equal(f.action.hidden, false);
  }
  f.send(f.tariff, true, 400);
  f.send(f.footer, true, 500);
  f.send(f.tariff, false);
  assert.equal(f.action.hidden, true, "footer is still visible");
});

test("landing action: degrades to native links without observer or required markup", () => {
  const f = fixture();
  assert.equal(initLandingAction(f.root, undefined), null);
  assert.equal(f.action.hidden, true);
  assert.equal(
    initLandingAction({querySelector: () => null}, f.Observer),
    null
  );
});
