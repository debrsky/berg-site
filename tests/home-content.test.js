import {readFileSync} from "node:fs";
import {test} from "node:test";
import {strict as assert} from "node:assert";

const html = readFileSync(
  new URL("../public/home.html", import.meta.url),
  "utf8"
);
const text = html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ");

test("Home: stays in the main site shell with calculation and order links", () => {
  assert.match(html, /class="nav-header"/);
  assert.match(html, /class="nav-footer"/);
  assert.doesNotMatch(
    html,
    /class="landing-shell|route-landing__mobile-action/
  );
  assert.match(html, /href="calculator.html">Рассчитать стоимость/);
  assert.match(html, /href="order.html">Оформить заявку/);
  assert.match(text, /Для расчёта понадобятся вес и объём груза/);
});

test("Home: three dispatch steps include the agreed warehouse pickup", () => {
  const steps = html.match(
    /<ol class="home-dispatch__steps">([\s\S]*?)<\/ol>/
  )?.[1];
  assert.ok(steps);
  assert.equal((steps.match(/<li\b/g) || []).length, 3);
  assert.doesNotMatch(steps, /role="list"|11:00|16:00/);
  assert.match(steps, /передайте водителю при согласованном заборе со склада/);
  assert.match(steps, /href="docs.html"/);
  assert.match(steps, /href="package.html"/);
});

test("Home: both deadlines and their qualifications stay outside the steps", () => {
  const cutoffs = html.match(
    /<section class="home-cutoffs"[\s\S]*?<\/section>/
  )?.[0];
  assert.ok(cutoffs);
  assert.equal((cutoffs.match(/class="home-cutoffs__item"/g) || []).length, 2);
  assert.match(cutoffs, /До 11:00/);
  assert.match(cutoffs, /До 16:00 сегодня/);
  assert.match(cutoffs, /по местному времени/);
  assert.match(cutoffs, /при наличии места на рейсе/);
  assert.match(cutoffs, /Время приёма не является расписанием рейсов/);
});

test("Home: reference links replace detailed terms without dropping the gallery", () => {
  const reference = html.match(
    /<section class="home-reference"[\s\S]*?<\/section>/
  )?.[0];
  assert.ok(reference);
  for (const page of ["terms", "package", "docs", "contacts"]) {
    assert.ok(reference.includes(`href="${page}.html"`), page);
  }
  assert.doesNotMatch(text, /Сроки и услуги|обычно 1 сутки/);
  assert.match(
    text,
    /Упаковку и обрешётку груза можно заказать только во Владивостоке/
  );
  assert.match(html, /<section class="home-gallery"/);
  assert.equal((html.match(/class="swiper-slide-img"/g) || []).length, 11);
});
