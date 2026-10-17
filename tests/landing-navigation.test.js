import {test} from "node:test";
import {strict as assert} from "node:assert";
import {initLandingNavigation} from "../src/js/common/landing-navigation.js";

function fixture({hash = "", reduced = false} = {}) {
  const events = {};
  const frames = [];
  const animations = [];
  const motion = {
    matches: reduced,
    addEventListener: (_, fn) => {
      motion.change = fn;
    }
  };
  const items = ["tariffs", "dispatch", "terminals", "questions"].map(
    (id, index) => {
      const attrs = {};
      const link = {
        getAttribute: () => "#" + id,
        setAttribute: (name, value) => {
          attrs[name] = value;
        },
        removeAttribute: (name) => {
          delete attrs[name];
        },
        addEventListener: (_, fn) => {
          link.click = fn;
        }
      };
      const heading = {
        animate: (keys, options) => {
          const animation = {
            id,
            keys,
            options,
            cancelled: false,
            cancel() {
              this.cancelled = true;
            }
          };
          animations.push(animation);
          return animation;
        }
      };
      const section = {
        top: 1000 + index * 1000,
        getBoundingClientRect: () => ({top: section.top}),
        querySelector: () => heading
      };
      return {id, attrs, link, section, heading};
    }
  );
  const root = {
    querySelectorAll: () => items.map((item) => item.link),
    getElementById: (id) => items.find((item) => item.id === id)?.section
  };
  const win = {
    innerHeight: 900,
    location: {hash},
    requestAnimationFrame: (fn) => frames.push(fn),
    matchMedia: () => motion,
    addEventListener: (event, fn) => {
      events[event] = fn;
    }
  };
  const flush = () => {
    while (frames.length) frames.shift()();
  };
  const current = () =>
    items
      .filter((item) => item.attrs["aria-current"] === "location")
      .map((item) => item.id);
  return {root, win, items, events, frames, animations, motion, flush, current};
}

test("landing navigation: tracks reading position in both directions without changing the hash", () => {
  const f = fixture();
  initLandingNavigation(f.root, f.win);
  assert.deepEqual(f.current(), []);
  f.items[0].section.top = -100;
  f.events.scroll();
  f.events.scroll();
  assert.equal(f.frames.length, 1, "one update per animation frame");
  f.flush();
  assert.deepEqual(f.current(), ["tariffs"]);
  f.items[1].section.top = 150;
  f.events.scroll();
  f.flush();
  assert.deepEqual(f.current(), ["dispatch"]);
  f.items[1].section.top = 500;
  f.events.scroll();
  f.flush();
  assert.deepEqual(f.current(), ["tariffs"]);
  f.items[0].section.top = 500;
  f.events.resize();
  f.flush();
  assert.deepEqual(f.current(), []);
  assert.equal(f.win.location.hash, "");
  assert.equal(
    f.animations.length,
    0,
    "ordinary scrolling does not flash headings"
  );
});

test("landing navigation: native hash changes and repeated anchor clicks highlight only their heading", () => {
  const f = fixture({hash: "#tariffs"});
  initLandingNavigation(f.root, f.win);
  assert.equal(f.animations[0].id, "tariffs");
  f.win.location.hash = "#terminals";
  f.events.hashchange();
  assert.equal(f.animations[0].cancelled, true);
  assert.equal(f.animations[1].id, "terminals");
  f.items[2].link.click({button: 0});
  assert.equal(f.animations[1].cancelled, true);
  assert.equal(f.animations.length, 3);
  f.items[2].link.click({button: 0, ctrlKey: true});
  assert.equal(f.animations.length, 3, "modified click is left alone");
  f.win.location.hash = "#top";
  f.events.hashchange();
  assert.equal(
    f.animations.length,
    3,
    "unrelated anchors do not highlight a section"
  );
});

test("landing navigation: reduced motion cancels emphasis but retains active navigation", () => {
  const f = fixture({hash: "#tariffs", reduced: true});
  f.items[0].section.top = 0;
  initLandingNavigation(f.root, f.win);
  assert.deepEqual(f.current(), ["tariffs"]);
  assert.equal(f.animations.length, 0);
  f.motion.matches = false;
  f.items[0].link.click({button: 0});
  assert.equal(f.animations.length, 1);
  f.motion.matches = true;
  f.motion.change();
  assert.equal(f.animations[0].cancelled, true);
});

test("landing navigation: absent navigation, missing sections and unsupported animation are harmless", () => {
  assert.doesNotThrow(() =>
    initLandingNavigation({querySelectorAll: () => []}, {})
  );
  const f = fixture({hash: "#tariffs"});
  f.root.getElementById = () => null;
  assert.doesNotThrow(() => initLandingNavigation(f.root, {}));
  const other = fixture({hash: "#tariffs"});
  other.items[0].heading.animate = undefined;
  assert.doesNotThrow(() => initLandingNavigation(other.root, other.win));
});
