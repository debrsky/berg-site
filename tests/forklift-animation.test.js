import {test} from "node:test";
import {strict as assert} from "node:assert";
import {initForkliftAnimation} from "../src/js/common/forklift-animation.js";

function fixture({reduced = false, width = 400} = {}) {
  const runs = [];
  const listeners = new Set();
  let notify;
  let disconnects = 0;
  let options;
  const part = (name) => ({
    attributes: new Map(),
    setAttribute(key, value) {
      this.attributes.set(key, value);
    },
    removeAttribute(key) {
      this.attributes.delete(key);
    },
    getBBox: () => ({x: 386, y: 376, width: 68, height: 68}),
    animate: (frames, timing) => {
      let finish;
      let rejectFinished;
      const animation = {
        finished: new Promise((resolve, reject) => {
          finish = resolve;
          rejectFinished = reject;
        }),
        cancelled: false,
        cancel() {
          this.cancelled = true;
          rejectFinished(new Error("cancelled"));
        }
      };
      runs.push({name, frames, timing, animation, finish});
      return animation;
    }
  });
  const vehicle = part("vehicle");
  const wheels = [part("front-wheel"), part("rear-wheel")];
  const lift = [part("cargo-rear"), part("forks"), part("cargo-front")];
  const scene = {
    querySelector: () => vehicle,
    querySelectorAll: (selector) =>
      selector === "[data-forklift-wheel]" ? wheels : lift,
    getBoundingClientRect: () => ({width})
  };
  const root = {querySelector: () => scene};
  const motion = {
    matches: reduced,
    addEventListener: (_, listener) => listeners.add(listener),
    removeEventListener: (_, listener) => listeners.delete(listener)
  };
  const viewport = {
    matchMedia: (query) => {
      assert.equal(query, "(prefers-reduced-motion: reduce)");
      return motion;
    },
    IntersectionObserver: class {
      constructor(callback, config) {
        notify = callback;
        options = config;
      }

      observe(element) {
        assert.equal(element, scene);
      }

      disconnect() {
        disconnects++;
      }
    }
  };
  return {
    root,
    viewport,
    vehicle,
    wheels,
    lift,
    motion,
    runs,
    listeners,
    get options() {
      return options;
    },
    get disconnects() {
      return disconnects;
    },
    send: (ratio = 1, visible = true) =>
      notify([
        {target: scene, isIntersecting: visible, intersectionRatio: ratio}
      ]),
    reduce: () => {
      motion.matches = true;
      listeners.forEach((listener) => listener());
    }
  };
}

test("forklift: waits for visibility, then drives and lifts once without looping", async () => {
  const f = fixture();
  initForkliftAnimation(f.root, f.viewport);
  assert.deepEqual(f.options, {threshold: 0.4});
  assert.equal(f.runs.length, 0);
  f.send(0, false);
  f.send(0.3);
  assert.equal(f.runs.length, 0);
  f.send(0.5);
  assert.equal(f.disconnects, 1);
  assert.equal(f.runs.length, 6);
  assert.deepEqual(f.runs[0].frames, [
    {transform: "translateX(16px)"},
    {transform: "translateX(0)"}
  ]);
  assert.equal(f.runs[0].timing.duration, 950);
  for (const run of f.runs.slice(1, 3)) {
    assert.equal(run.frames[1].transform, "rotate(-26deg)");
    assert.equal(run.timing.duration, 950);
  }
  for (const run of f.runs.slice(3)) {
    assert.equal(run.frames[1].transform, "translateY(-12px)");
    assert.equal(run.timing.delay, 1050);
    assert.equal(run.timing.duration, 750);
  }
  for (const run of f.runs) {
    assert.equal(run.timing.fill, "both");
    assert.notEqual(run.timing.iterations, Infinity);
    run.finish();
  }
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(f.listeners.size, 0);
  assert.ok(f.runs.every((run) => run.animation.cancelled));
  assert.equal(f.vehicle.attributes.has("transform"), false);
  for (const wheel of f.wheels) {
    assert.equal(wheel.attributes.get("transform"), "rotate(-26 420 410)");
    assert.equal(wheel.attributes.has("data-forklift-moving"), false);
  }
  for (const part of f.lift)
    assert.equal(part.attributes.get("transform"), "translate(0 -12)");
  f.send();
  assert.equal(f.runs.length, 6);
});

test("forklift: hidden mobile illustration never starts", () => {
  const f = fixture({width: 0});
  initForkliftAnimation(f.root, f.viewport);
  f.send();
  assert.equal(f.runs.length, 0);
});

test("forklift: reduced motion and unsupported browsers retain static artwork", () => {
  const f = fixture({reduced: true});
  assert.equal(initForkliftAnimation(f.root, f.viewport), null);
  assert.equal(f.runs.length, 0);
  assert.equal(f.listeners.size, 0);
  const unsupported = fixture();
  delete unsupported.vehicle.animate;
  assert.equal(
    initForkliftAnimation(unsupported.root, unsupported.viewport),
    null
  );
  const noObserver = fixture();
  delete noObserver.viewport.IntersectionObserver;
  assert.equal(
    initForkliftAnimation(noObserver.root, noObserver.viewport),
    null
  );
  assert.equal(initForkliftAnimation({querySelector: () => null}, {}), null);
});

test("forklift: enabling reduced motion while waiting prevents playback", () => {
  const f = fixture();
  initForkliftAnimation(f.root, f.viewport);
  f.reduce();
  assert.equal(f.disconnects, 1);
  assert.equal(f.listeners.size, 0);
  f.send();
  assert.equal(f.runs.length, 0);
});

test("forklift: enabling reduced motion during playback cancels every moving part", async () => {
  const f = fixture();
  initForkliftAnimation(f.root, f.viewport);
  f.send();
  f.reduce();
  assert.equal(f.runs.length, 6);
  assert.ok(f.runs.every((run) => run.animation.cancelled));
  await new Promise((resolve) => setImmediate(resolve));
  for (const part of [...f.wheels, ...f.lift]) {
    assert.equal(part.attributes.has("transform"), false);
    assert.equal(part.attributes.has("data-forklift-moving"), false);
  }
  assert.equal(f.listeners.size, 0);
  f.send();
  assert.equal(f.runs.length, 6);
});
