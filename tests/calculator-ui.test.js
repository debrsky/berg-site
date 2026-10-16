import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";

test("calculator: order CTA belongs to the result panel and remains a native link", () => {
  const html = readFileSync(
    new URL("../public/calculator.html", import.meta.url),
    "utf8"
  );
  const form = html.match(
    /<form[^>]*name="calculator"[^>]*>([\s\S]*?)<\/form>/
  )[1];
  const result = form.slice(
    form.indexOf('class="form__section-content calculator-result"')
  );
  assert.match(result, /<output name="result"/);
  assert.match(result, /class="calculator-result__next"/);
  assert.match(
    result,
    /<a class="button button--primary calculator-result__order" href="order.html" data-calculator-order/
  );
  assert.match(result, /выбранный маршрут и введённые вес и объём/);
  assert.match(result, /Сохранённые данные не заменяются автоматически/);
  assert.equal((html.match(/data-calculator-order/g) || []).length, 1);
  assert.doesNotMatch(result, /<button/);
  assert.match(result, /cargo-category calculator-result__category[^>]*hidden/);
});
