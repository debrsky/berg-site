import {test} from "node:test";
import {strict as assert} from "node:assert";
import {initPhoneCopy} from "../src/js/common/phone-copy.js";

function fixture(writeText = async () => {}) {
  const status = {hidden: true, textContent: ""};
  let click;
  const timers = new Map();
  let nextTimer = 0;
  const button = {
    hidden: true,
    disabled: false,
    dataset: {copyPhone: "+79243304405"},
    parentElement: {querySelector: () => status},
    addEventListener: (event, handler) => {
      assert.equal(event, "click");
      click = handler;
    }
  };
  const win = {
    isSecureContext: true,
    navigator: {clipboard: {writeText}},
    setTimeout: (callback) => {
      timers.set(++nextTimer, callback);
      return nextTimer;
    },
    clearTimeout: (id) => timers.delete(id)
  };
  const root = {querySelectorAll: () => [button]};
  return {root, win, status, button, timers, click: () => click()};
}

test("phone copy: reveals control only with secure Clipboard API", () => {
  for (const setup of [
    (win) => {
      win.isSecureContext = false;
    },
    (win) => {
      win.navigator.clipboard = undefined;
    }
  ]) {
    const f = fixture();
    setup(f.win);
    initPhoneCopy(f.root, f.win);
    assert.equal(f.button.hidden, true);
    assert.equal(f.status.hidden, true);
  }
});

test("phone copy: copies the exact number, confirms and resets without accumulating timers", async () => {
  const copied = [];
  const f = fixture(async (text) => copied.push(text));
  initPhoneCopy(f.root, f.win);
  assert.equal(f.button.hidden, false);
  assert.equal(f.status.hidden, false);
  const pending = f.click();
  assert.equal(f.button.disabled, true);
  await pending;
  assert.deepEqual(copied, ["+79243304405"]);
  assert.equal(f.status.textContent, "Скопировано");
  assert.equal(f.button.disabled, false);
  await f.click();
  assert.equal(f.timers.size, 1);
  [...f.timers.values()][0]();
  assert.equal(f.status.textContent, "");
});

test("phone copy: permission denial is handled, button can be retried", async () => {
  const f = fixture(async () => {
    throw new Error("Permission denied");
  });
  initPhoneCopy(f.root, f.win);
  await f.click();
  assert.match(f.status.textContent, /Не удалось скопировать/);
  assert.equal(f.button.disabled, false);
  await f.click();
  assert.equal(f.timers.size, 1);
});
