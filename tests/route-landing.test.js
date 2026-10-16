import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync, existsSync} from "node:fs";
const publicDir = new URL("../public/", import.meta.url);
const read = (name) => readFileSync(new URL(name, publicDir), "utf8");
const page = "vladivostok-khabarovsk.html";
const home = "home.html";
const pricing = "pricing.html";

test("route landing: HTML contains exact tariff limits, examples, schedule and route contacts", () => {
  const html = read(page);
  const main = html.match(
    /<article class="route-landing">([\s\S]*?)<\/article>/
  )[1];
  assert.match(main, /Обычный срок доставки — 1 сутки/);
  assert.match(main, /До 3 календарных суток/);
  assert.match(main, /от приёма груза на склад/);
  assert.match(main, /каждый рабочий день/);
  assert.match(main, /менее 0,0025 м³/);
  assert.doesNotMatch(main, /менее 0,003 м³/);
  for (const value of ["550 руб.", "5 500 руб.", "2 200 руб."])
    assert.ok(main.includes(value));
  for (const number of ["+79243304405", "+79842953632"])
    assert.ok(main.includes('href="tel:' + number + '"'));
  assert.match(main, /11:00/);
  assert.match(main, /16:00/);
  assert.match(main, /только во Владивостоке/);
  assert.match(main, /200 руб.\/сутки за весь груз/);
  assert.match(main, /500 руб.\/м³ в сутки/);
  assert.equal((main.match(/<details>/g) || []).length, 5);
  assert.doesNotMatch(main, /<form|<img|FAQPage|khabarovsk-vladivostok\.html/);
});

test("route landing: CTA and internal links exist; only implemented landing is linked", () => {
  for (const file of [page, home, pricing]) {
    for (const [, href] of read(file).matchAll(/href="([^"]+)"/g)) {
      if (/^(https?:|tel:|mailto:|#)/.test(href)) continue;
      const path = href.split(/[?#]/)[0];
      assert.ok(existsSync(new URL(path, publicDir)), file + ": " + href);
    }
  }
  const html = read(page);
  assert.equal((html.match(/data-route-goal="calculator"/g) || []).length, 3);
  assert.equal((html.match(/data-route-goal="order"/g) || []).length, 3);
  assert.match(html, /calculator\.html\?origin=vvo&amp;destination=khb/);
  assert.match(html, /order\.html\?origin=vvo&amp;destination=khb/);
  assert.ok(read(home).includes(page));
  assert.ok(read(pricing).includes(page));
  for (const file of ["calculator.html", "order.html"]) {
    assert.match(read(file), /data-route-notice/);
    assert.match(read(file), /id="route-tariffs"/);
    assert.match(read(file), /src="js\/route.js"/);
  }
});

test("route landing: independent shell and assets without the site navigation or city detection", () => {
  const html = read(page);
  assert.match(html, /<body[^>]*class="landing-shell"/);
  assert.match(html, /href="css\/landing.css"/);
  assert.match(html, /src="js\/landing.js"/);
  assert.match(html, /src="js\/route.js"/);
  assert.match(html, /href="#landing-main"/);
  assert.match(html, /id="landing-main"/);
  assert.doesNotMatch(
    html,
    /css\/style.css|js\/index.js|contacts__place-selector|class="nav-header|class="nav-footer|class="announcement|browser-updater/
  );
  const header = html.match(
    /<header class="landing-shell__header">([\s\S]*?)<\/header>/
  )[1];
  assert.match(header, /href="home.html" target="_blank" rel="noopener"/);
  assert.match(header, /href="tel:\+79243304405"/);
  assert.match(header, /data-route-goal="phone"/);
  assert.doesNotMatch(header, /<select|order.html|calculator.html/);
  assert.equal((html.match(/87156585, "init"/g) || []).length, 1);
  const landingScript = read("js/landing.js");
  assert.doesNotMatch(
    landingScript,
    /dadata|contacts__place-selector|userPlace/i
  );
  assert.match(landingScript, /theme-toggle/);
  const landingCss = read("css/landing.css");
  assert.match(landingCss, /\.landing-shell/);
  assert.match(landingCss, /\.route-landing/);
  assert.doesNotMatch(landingCss, /\.nav-header|\.nav-footer|\.contacts__/);
  assert.doesNotMatch(read("css/style.css"), /\.landing-shell|\.route-landing/);
});

test("route landing: site pages retain their standard shell and one shared counter", () => {
  for (const file of [home, pricing, "order.html", "calculator.html"]) {
    const html = read(file);
    assert.match(html, /class="nav-header/);
    assert.match(html, /class="nav-footer/);
    assert.match(html, /id="contacts__place-selector"/);
    assert.match(html, /href="css\/style.css"/);
    assert.match(html, /src="js\/index.js"/);
    assert.doesNotMatch(html, /landing-shell|css\/landing.css|js\/landing.js/);
    assert.equal((html.match(/87156585, "init"/g) || []).length, 1);
  }
});

test("route landing: redesigned hierarchy preserves conditions and accessible steps", () => {
  const html = read(page);
  const hero = html.match(
    /<header class="route-landing__hero">([\s\S]*?)<\/header>/
  )[1];
  assert.match(hero, /route-landing__title-kicker">Грузоперевозки/);
  assert.match(hero, /route-landing__title-city">Владивосток/);
  assert.match(hero, /route-landing__title-city">Хабаровск/);
  assert.match(hero, /route-landing__journey/);
  assert.match(hero, /route-landing__schedule">Рейсы каждый рабочий день/);
  assert.match(
    html,
    /После 11:00 отправка возможна при наличии места на рейсе/
  );
  assert.match(hero, /гарантированный срок от приёма груза на склад/);
  assert.ok(
    html.indexOf('class="route-landing__examples"') <
      html.indexOf('class="route-landing__tariffs"')
  );
  assert.equal((html.match(/Только межгород, включая НДС/g) || []).length, 3);
  const steps = html.match(
    /<ol class="route-landing__steps" role="list">([\s\S]*?)<\/ol>/
  )[1];
  assert.equal((steps.match(/<li>/g) || []).length, 4);
  assert.match(html, /route-landing__cutoff-time">До 11:00/);
  assert.match(html, /route-landing__cutoff-time">До 16:00/);
  assert.match(
    html,
    /Это срок заявки на машину; он не заменяет регламент сдачи груза/
  );
});

test("route landing: three tariff categories have separate cards with accessible tables", () => {
  const html = read(page);
  const cards = [
    ...html.matchAll(
      /<div class="route-landing__tariff-card">([\s\S]*?)<\/div>/g
    )
  ].map((match) => match[1]);
  assert.equal(cards.length, 3);
  const categories = ["Минимальные категории", "Тяжёлый груз", "Лёгкий груз"];
  const units = ["руб. за отправку", "руб./кг", "руб./м³"];
  cards.forEach((card, index) => {
    assert.equal((card.match(/<table/g) || []).length, 1);
    assert.match(card, /<caption>/);
    assert.ok(card.includes(categories[index]));
    assert.ok(card.includes(units[index]));
    assert.match(card, /scope="row"/);
    assert.match(card, /scope="col"/);
  });
});

test("route landing: all document links open a safe new tab; anchors and phones stay native", () => {
  const html = read(page);
  const links = [...html.matchAll(/<a\b([^>]+)>/g)];
  let outgoing = 0;
  for (const [, attributes] of links) {
    const href = attributes.match(/href="([^"]+)"/)?.[1];
    assert.ok(href);
    if (/^(#|tel:|mailto:)/.test(href)) {
      assert.doesNotMatch(attributes, /target="_blank"/);
    } else {
      outgoing++;
      assert.match(attributes, /target="_blank"/, href);
      assert.match(attributes, /rel="[^"]*\bnoopener\b/, href);
    }
  }
  assert.ok(outgoing > 10);
  assert.match(
    html,
    /class="landing-shell__brand" href="home.html" target="_blank"/
  );
});
