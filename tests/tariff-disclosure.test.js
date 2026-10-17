import {test} from "node:test";
import {strict as assert} from "node:assert";
import {initTariffDisclosure} from "../src/js/common/tariff-disclosure.js";

test("tariff disclosure: collapses, focuses the native summary and returns to it", () => {
  const calls = [];
  const summary = {
    focus: (options) => calls.push(["focus", options]),
    scrollIntoView: (options) => calls.push(["scroll", options])
  };
  const disclosure = {open: true, querySelector: () => summary};
  let click;
  const button = {
    hidden: true,
    closest: () => disclosure,
    addEventListener: (_, handler) => {
      click = handler;
    }
  };
  initTariffDisclosure({querySelectorAll: () => [button]});
  assert.equal(button.hidden, false);
  click();
  assert.equal(disclosure.open, false);
  assert.deepEqual(calls, [
    ["focus", {preventScroll: true}],
    ["scroll", {block: "start", behavior: "auto"}]
  ]);
  disclosure.open = true;
  click();
  assert.equal(disclosure.open, false);
});

test("tariff disclosure: incomplete markup remains hidden and does not throw", () => {
  for (const disclosure of [null, {querySelector: () => null}]) {
    const button = {hidden: true, closest: () => disclosure};
    assert.doesNotThrow(() =>
      initTariffDisclosure({querySelectorAll: () => [button]})
    );
    assert.equal(button.hidden, true);
  }
  assert.doesNotThrow(() => initTariffDisclosure({querySelectorAll: () => []}));
});
