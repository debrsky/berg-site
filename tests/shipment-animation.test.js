import {test} from "node:test";
import {strict as assert} from "node:assert";
import {initShipmentAnimation} from "../src/js/common/shipment-animation.js";

function setup({reduced = false, width = 300} = {}) {
  const calls = [];
  let notify;
  let change;
  const motion = {
    matches: reduced,
    addEventListener: (_, fn) => {
      change = fn;
    },
    removeEventListener: () => {
      change = null;
    }
  };
  const part = {
    animate: (frames, options) => {
      let finish;
      const animation = {
        finished: new Promise((resolve) => {
          finish = resolve;
        }),
        cancel: () => {
          animation.cancelled = true;
        }
      };
      calls.push({frames, options, animation, finish});
      return animation;
    }
  };
  const scene = {
    querySelector: () => part,
    getBoundingClientRect: () => ({width})
  };
  const root = {querySelector: () => scene};
  const viewport = {
    matchMedia: () => motion,
    IntersectionObserver: class {
      constructor(fn) {
        notify = fn;
      }

      observe() {}
      disconnect() {
        this.disconnected = true;
      }
    }
  };
  return {
    root,
    viewport,
    calls,
    motion,
    visible: () =>
      notify([{target: scene, isIntersecting: true, intersectionRatio: 1}]),
    reduce: () => {
      motion.matches = true;
      change?.();
    }
  };
}

test("shipment: seals top then side once and releases animation effects", async () => {
  const env = setup();
  const observer = initShipmentAnimation(env.root, env.viewport);
  assert.equal(env.calls.length, 0);
  env.visible();
  env.visible();
  assert.equal(env.calls.length, 2);
  assert.equal(observer.disconnected, true);
  assert.equal(env.calls[0].options.duration, env.calls[1].options.delay);
  assert.match(env.calls[0].frames[0].clipPath, /100% 0 0/);
  assert.match(env.calls[1].frames[0].clipPath, /0 0 100%/);
  env.calls.forEach((call) => call.finish());
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(env.calls.every((call) => call.animation.cancelled));
});

test("shipment: reduced motion, hidden mobile and missing APIs remain static", () => {
  const reduced = setup({reduced: true});
  assert.equal(initShipmentAnimation(reduced.root, reduced.viewport), null);
  const hidden = setup({width: 0});
  initShipmentAnimation(hidden.root, hidden.viewport);
  hidden.visible();
  assert.equal(hidden.calls.length, 0);
  assert.equal(initShipmentAnimation({querySelector: () => null}, {}), null);
});

test("shipment: enabling reduced motion stops playback or prevents its start", () => {
  for (const playing of [false, true]) {
    const env = setup();
    const observer = initShipmentAnimation(env.root, env.viewport);
    if (playing) env.visible();
    env.reduce();
    env.visible();
    assert.equal(observer.disconnected, true);
    assert.equal(env.calls.length, playing ? 2 : 0);
    assert.ok(env.calls.every((call) => call.animation.cancelled));
  }
});
