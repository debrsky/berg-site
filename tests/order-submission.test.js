/* eslint-disable sonarjs/no-duplicate-string -- Repeated literals make state assertions explicit. */
import {test} from "node:test";
import {strict as assert} from "node:assert";
import {setTimeout as delay} from "node:timers/promises";
import {initOrderSubmission} from "../src/js/order/submission.js";

function createUI(options = {}) {
  const attributes = new Map();
  const classes = new Set();
  const label = {textContent: "Отправить заявку"};
  const status = {textContent: ""};
  const error = {textContent: ""};
  const group = {
    classList: {
      add: (value) => classes.add(value),
      remove: (value) => classes.delete(value)
    },
    querySelector: (selector) =>
      selector === ".order-submit__status" ? status : error
  };
  const button = {
    setAttribute: (key, value) => attributes.set(key, value),
    querySelector: () => label,
    closest: () => group
  };
  let handler;
  let successes = 0;
  let preparations = 0;
  const body = new FormData();
  body.append("data", JSON.stringify({cargo: "Коробки"}));
  const form = {
    querySelector: () => button,
    addEventListener: (name, callback) => {
      assert.equal(name, "submit");
      handler = callback;
    }
  };
  initOrderSubmission(form, {
    createBody: () => {
      preparations++;
      return body;
    },
    onSuccess: () => successes++,
    minimumSendingMs: 0,
    ...options
  });
  return {
    submit: () => handler({preventDefault: () => {}}),
    label,
    status,
    error,
    attributes,
    classes,
    body,
    successes: () => successes,
    preparations: () => preparations
  };
}

const response = (result) => ({ok: true, json: async () => ({result})});

test("submission: busy state blocks duplicates and stays locked after success", async () => {
  let resolveRequest;
  let request;
  const ui = createUI({
    fetchRequest: (url, options) => {
      request = {url, options};
      return new Promise((resolve) => {
        resolveRequest = resolve;
      });
    }
  });
  const pending = ui.submit();
  assert.equal(ui.attributes.get("aria-busy"), "true");
  assert.equal(ui.attributes.get("aria-disabled"), "true");
  assert.equal(ui.label.textContent, "Отправляем заявку…");
  assert.match(ui.status.textContent, /дождитесь подтверждения/);
  await ui.submit();
  assert.equal(ui.preparations(), 1);
  assert.equal(request.url, "php/mailer/send.php");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.body, ui.body);
  assert.equal(request.options.signal.aborted, false);

  resolveRequest(response("success"));
  await pending;
  assert.equal(ui.successes(), 1);
  assert.equal(ui.attributes.get("aria-busy"), "false");
  assert.equal(ui.attributes.get("aria-disabled"), "true");
  assert.equal(ui.label.textContent, "Заявка отправлена");
  assert.equal(ui.classes.has("control-group--error"), false);
  await ui.submit();
  assert.equal(ui.preparations(), 1);
});

test("submission: mail failure restores the button and allows a clean retry", async () => {
  let attempt = 0;
  const ui = createUI({
    fetchRequest: async () => response(attempt++ === 0 ? "error" : "success")
  });
  await ui.submit();
  assert.equal(ui.successes(), 0);
  assert.equal(ui.attributes.get("aria-disabled"), "false");
  assert.equal(ui.attributes.get("aria-busy"), "false");
  assert.equal(ui.label.textContent, "Повторить отправку");
  assert.match(ui.error.textContent, /Почтовый сервер/);
  assert.equal(ui.status.textContent, "");
  assert.equal(ui.classes.has("control-group--error"), true);

  await ui.submit();
  assert.equal(ui.successes(), 1);
  assert.equal(ui.classes.has("control-group--error"), false);
  assert.equal(ui.error.textContent, "");
});

for (const [name, fetchRequest] of [
  ["network failure", async () => Promise.reject(Error("Offline"))],
  ["http failure", async () => ({ok: false})],
  [
    "invalid json",
    async () => ({ok: true, json: async () => Promise.reject(Error("JSON"))})
  ],
  ["unexpected result", async () => response("unknown")]
]) {
  test(`submission: ${name} does not falsely claim non-delivery`, async () => {
    const ui = createUI({fetchRequest});
    await ui.submit();
    assert.match(ui.error.textContent, /Заявка могла быть принята/);
    assert.equal(ui.successes(), 0);
    assert.equal(ui.attributes.get("aria-disabled"), "false");
    assert.equal(ui.attributes.get("aria-busy"), "false");
  });
}

test("submission: preparation failure also unlocks the button", async () => {
  let requested = false;
  const ui = createUI({
    createBody: () => {
      throw Error("Storage unavailable");
    },
    fetchRequest: async () => {
      requested = true;
    }
  });
  await ui.submit();
  assert.equal(requested, false);
  assert.match(ui.error.textContent, /Не удалось подготовить/);
  assert.equal(ui.attributes.get("aria-disabled"), "false");
  assert.equal(ui.attributes.get("aria-busy"), "false");
});

test("submission: slow request announces waiting, then aborts on timeout", async () => {
  const ui = createUI({
    timeoutMs: 100,
    slowNoticeMs: 0,
    fetchRequest: (url, {signal}) =>
      new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(Error("Aborted")));
      })
  });
  const pending = ui.submit();
  await delay(5);
  assert.match(ui.status.textContent, /Сервер отвечает дольше/);
  await pending;
  assert.match(ui.error.textContent, /Время ожидания ответа истекло/);
  assert.match(ui.error.textContent, /Заявка могла быть принята/);
  assert.equal(ui.successes(), 0);
  assert.equal(ui.attributes.get("aria-disabled"), "false");
  assert.equal(ui.attributes.get("aria-busy"), "false");
});

test("submission: successful response clears both waiting timers", async () => {
  let signal;
  const ui = createUI({
    timeoutMs: 10,
    slowNoticeMs: 5,
    fetchRequest: async (url, options) => {
      signal = options.signal;
      return response("success");
    }
  });
  await ui.submit();
  await delay(20);
  assert.equal(signal.aborted, false);
  assert.match(ui.status.textContent, /Заявка отправлена/);
});

test("submission: fast success keeps animation and duplicate protection for the minimum duration", async (t) => {
  t.mock.timers.enable({apis: ["setTimeout"]});
  t.mock.method(performance, "now", () => 0);
  let signal;
  const ui = createUI({
    minimumSendingMs: 1200,
    timeoutMs: 100,
    slowNoticeMs: 50,
    fetchRequest: async (url, options) => {
      signal = options.signal;
      return response("success");
    }
  });
  const pending = ui.submit();
  // Даём завершиться fetch и чтению JSON перед проверкой выдержки.
  await Promise.resolve();
  await Promise.resolve();
  t.mock.timers.tick(1199);
  assert.equal(signal.aborted, false);
  assert.equal(ui.attributes.get("aria-busy"), "true");
  assert.equal(ui.attributes.get("aria-disabled"), "true");
  assert.equal(ui.label.textContent, "Отправляем заявку…");
  assert.match(ui.status.textContent, /дождитесь подтверждения/);
  assert.equal(ui.successes(), 0);
  await ui.submit();
  assert.equal(ui.preparations(), 1);

  t.mock.timers.tick(1);
  await pending;
  assert.equal(ui.successes(), 1);
  assert.equal(ui.attributes.get("aria-busy"), "false");
});

test("submission: slow success does not add a delay after the response", async (t) => {
  t.mock.timers.enable({apis: ["setTimeout"]});
  let now = 0;
  t.mock.method(performance, "now", () => now);
  let resolveRequest;
  const ui = createUI({
    minimumSendingMs: 1200,
    fetchRequest: () =>
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
  });
  const pending = ui.submit();
  now = 2000;
  t.mock.timers.tick(2000);
  resolveRequest(response("success"));
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(ui.successes(), 1);
  await pending;
});

test("submission: errors do not wait for the minimum animation duration", async (t) => {
  t.mock.timers.enable({apis: ["setTimeout"]});
  t.mock.method(performance, "now", () => 0);
  const ui = createUI({
    minimumSendingMs: 1200,
    fetchRequest: async () => response("error")
  });
  const pending = ui.submit();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(ui.label.textContent, "Повторить отправку");
  assert.equal(ui.attributes.get("aria-disabled"), "false");
  await pending;
});

test("submission: success callback failure is not reported as delivery failure", async () => {
  const ui = createUI({
    fetchRequest: async () => response("success"),
    onSuccess: () => {
      throw Error("Navigation failed");
    }
  });
  await assert.rejects(ui.submit(), /Navigation failed/);
  assert.equal(ui.error.textContent, "");
  assert.equal(ui.classes.has("control-group--error"), false);
  assert.equal(ui.attributes.get("aria-disabled"), "true");
  assert.equal(ui.label.textContent, "Заявка отправлена");
});
