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
  assert.match(main, /<dt>Обычно<\/dt><dd>За сутки<\/dd>/);
  assert.match(main, /До 3 календарных суток/);
  assert.match(main, /от приёма груза/);
  assert.match(main, /по рабочим дням/);
  const text = main.replace(/<[^>]*>/g, "");
  assert.match(text, /менее 0,0025 м³/);
  assert.doesNotMatch(text, /менее 0,003 м³/);
  for (const value of ["250 руб.", "550 руб.", "5 500 руб.", "2 200 руб."])
    assert.ok(text.replace(/\u00a0/g, " ").includes(value));
  for (const number of ["+79243304405", "+79842953632"])
    assert.ok(main.includes('href="tel:' + number + '"'));
  assert.match(main, /11:00/);
  assert.match(main, /16:00/);
  assert.match(main, /только во Владивостоке/);
  assert.match(main, /200 руб.\/сутки за весь груз/);
  assert.match(main, /500 руб.\/м³ в сутки/);
  assert.equal((main.match(/<details\b/g) || []).length, 6);
  assert.doesNotMatch(main, /<form|FAQPage/);
  assert.match(main, /href="khabarovsk-vladivostok\.html"/);
  assert.match(
    main,
    /<svg[^>]*class="route-landing__illustration"[^>]*width="575" height="365" role="img" aria-labelledby="route-forklift-title" data-forklift/
  );
  assert.match(
    main,
    /<title id="route-forklift-title">Погрузчик с паллетированным грузом — иллюстрация<\/title>/
  );
  assert.equal((main.match(/data-forklift-vehicle/g) || []).length, 1);
  assert.equal((main.match(/data-forklift-wheel=/g) || []).length, 2);
  assert.equal((main.match(/data-forklift-lift=/g) || []).length, 3);
  assert.doesNotMatch(
    main,
    /<animate|<script[^>]*src="https?:\/\/.*animation/i
  );
  assert.ok(existsSync(new URL("img/route-forklift.svg", publicDir)));
  assert.match(html, /landing-shell__credit/);
  assert.match(
    html,
    /href="https:\/\/storyset.com\/illustration\/logistics\/pana"/
  );
  const illustration = read("img/route-forklift.svg");
  assert.doesNotMatch(illustration, /<script|<foreignObject|\bhref=/i);
});

test("route landing: CTA and internal links exist; home links to landing but pricing does not", () => {
  for (const file of [page, home, pricing]) {
    for (const [, href] of read(file).matchAll(/href="([^"]+)"/g)) {
      if (/^(https?:|tel:|mailto:|#)/.test(href)) continue;
      const path = href.split(/[?#]/)[0];
      assert.ok(existsSync(new URL(path, publicDir)), file + ": " + href);
    }
  }
  const html = read(page);
  assert.equal((html.match(/data-route-goal="calculator"/g) || []).length, 4);
  assert.equal((html.match(/data-route-goal="order"/g) || []).length, 3);
  assert.match(html, /calculator\.html\?origin=vvo&amp;destination=khb/);
  assert.match(html, /order\.html\?origin=vvo&amp;destination=khb/);
  assert.ok(read(home).includes(page));
  assert.ok(!read(pricing).includes(`href="${page}"`));
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
  assert.match(hero, /route-landing__facts/);
  assert.doesNotMatch(
    hero,
    /route-landing__journey|route-landing__duration|route-landing__road/
  );
  assert.match(hero, /route-landing__schedule">Рейсы по рабочим дням/);
  assert.match(
    html,
    /После 11:00 отправка возможна при наличии места на рейсе/
  );
  assert.match(
    hero,
    /<dt>Гарантированный срок<\/dt><dd>До 3 календарных суток<\/dd>/
  );
  assert.match(hero, /От момента приёма груза, для любого принятого груза/);
  assert.ok(html.indexOf('id="tariffs"') < html.indexOf('id="dispatch"'));
  assert.ok(html.indexOf('id="dispatch"') < html.indexOf('id="terminals"'));
  assert.ok(
    html.indexOf('class="route-landing__examples"') <
      html.indexOf('class="route-landing__tariffs"')
  );
  assert.match(hero, /route-landing__illustration/);
  assert.doesNotMatch(
    html,
    /route-landing__eyebrow|route-landing__example-category/
  );
  assert.doesNotMatch(hero, /route-landing__hero-contact/);
  assert.match(
    html,
    /<details class="route-landing__disclosure"><summary>Подробные тарифы/
  );
  assert.match(
    html,
    /<aside class="route-landing__mobile-action"[^>]*>[\s\S]*?data-cta-position="mobile"/
  );
  assert.match(html, /Для расчёта понадобятся вес и объём груза/);
  assert.equal((html.match(/Между терминалами, включая НДС/g) || []).length, 1);
  assert.doesNotMatch(html, /Рассчитать мой груз|не выбраны ДВС|1 сутки/);
  const calculatorLinks = [
    ...html.matchAll(/<a\b[^>]*data-route-goal="calculator"[^>]*>([^<]+)<\/a>/g)
  ];
  assert.equal(calculatorLinks.length, 4);
  for (const [, label] of calculatorLinks)
    assert.equal(label, "Рассчитать стоимость");
  assert.match(html, /Без надбавок за негабарит, ДВС и температурный режим/);
  assert.ok(
    html.indexOf('class="route-landing__navigation"') >
      html.indexOf("</header>", html.indexOf('class="route-landing__hero"'))
  );
  assert.match(
    html,
    /<button class="route-landing__collapse" type="button" data-collapse-tariffs hidden>Свернуть подробные тарифы<\/button>/
  );
  assert.match(html, /route-landing__mobile-action"[^>]*hidden/);
  assert.equal((html.match(/>Схема проезда<\/a>/g) || []).length, 2);
  assert.match(html, /pt=131\.915753,43\.189470/);
  assert.match(html, /pt=135\.145785,48\.482212/);
  assert.match(html, /Отправить во Владивостоке/);
  assert.match(html, /Получить в Хабаровске/);
  const dispatch = html.match(
    /<section\b[^>]*id="dispatch"[^>]*>([\s\S]*?)<\/section>/
  )[1];
  assert.doesNotMatch(
    dispatch,
    /route-landing__cutoffs|route-landing__service-notes/
  );
  assert.match(html, /Когда передать груз/);
  assert.match(html, /Дополнительные услуги/);
  const steps = html.match(
    /<ol class="route-landing__steps">([\s\S]*?)<\/ol>/
  )[1];
  assert.equal((steps.match(/<li>/g) || []).length, 4);
  assert.match(html, /route-landing__cutoff-time">До 11:00/);
  assert.match(html, /route-landing__cutoff-time">До 16:00/);
  assert.match(
    html,
    /Это срок подачи заявки; он не заменяет регламент сдачи груза/
  );
  assert.match(
    html,
    /Заявку на завтра \(на подачу машины и на сдачу груза на терминал\) необходимо подать сегодня до 16:00/
  );
  assert.doesNotMatch(html, /Это срок заявки на машину/);
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

test("route landing: tariff typography keeps quantities together and machine trips full-width", () => {
  const html = read(page);
  assert.match(html, /class="route-landing__nowrap">0,0025 м³<\/span>/);
  assert.match(html, /class="route-landing__nowrap">0,5 кг<\/span>/);
  assert.equal(
    (
      html.match(
        /class="route-landing__machine-trip" scope="row" colspan="2"/g
      ) || []
    ).length,
    2
  );
  assert.equal(
    (
      html.match(/class="route-landing__nowrap">по договорённости<\/span>/g) ||
      []
    ).length,
    2
  );
});

test("route landing: fine details are decorative and phone copying is progressive", () => {
  const html = read(page);
  const icons = [
    ...html.matchAll(/<svg class="route-landing__cargo-icon"[^>]*>/g)
  ];
  assert.equal(icons.length, 4);
  for (const [icon] of icons) {
    assert.match(icon, /aria-hidden="true"/);
    assert.match(icon, /focusable="false"/);
  }
  assert.equal(
    (html.match(/class="route-landing__amount-unit"/g) || []).length,
    4
  );
  assert.match(html, /10\u00a0кг/);
  assert.match(html, /0,3\u00a0кг/);
  assert.match(html, /0,001\u00a0м³/);
  for (const note of [
    "Небольшой пакет бумаг",
    "Компактный груз в коробке",
    "Большой вес при небольшом объёме",
    "Лёгкий, но занимает много места"
  ]) {
    assert.ok(html.includes(note));
  }
  assert.equal(
    (html.match(/class="route-landing__example-note"/g) || []).length,
    4
  );
  assert.match(html, /0,1\u00a0м³/);
  const buttons = [
    ...html.matchAll(/<button class="route-landing__copy"[^>]*>/g)
  ];
  assert.equal(buttons.length, 3);
  for (const [button] of buttons) {
    assert.match(button, /type="button"/);
    assert.match(button, /aria-label="Скопировать номер/);
    assert.match(button, /hidden/);
  }
  assert.equal(
    (
      html.match(
        /role="status" aria-live="polite" aria-atomic="true" hidden/g
      ) || []
    ).length,
    3
  );
  assert.match(html, /route-landing__terminal-label--destination/);
  assert.match(
    read("css/landing.css"),
    /prefers-reduced-motion:\s*no-preference/
  );
});

test("route landing: cohesive artwork and grouped deadlines preserve route information", () => {
  const html = read(page);
  assert.doesNotMatch(html, /route-landing__cargo-accent/);
  assert.equal(
    (html.match(/class="route-landing__cargo-ground"/g) || []).length,
    4
  );
  assert.equal(
    (html.match(/class="route-landing__cargo-label"/g) || []).length,
    3
  );
  assert.equal(
    (html.match(/class="route-landing__cutoff-detail"/g) || []).length,
    2
  );
  assert.match(html, /route-landing__section--dispatch/);
  assert.match(html, /route-landing__section--terminals/);
  assert.match(html, /route-landing__section--questions/);
  assert.match(html, /Сдача груза на терминал/);
  assert.match(html, /Заявка на грузоперевозку/);
  assert.match(
    html,
    /После 11:00 отправка возможна при наличии места на рейсе/
  );
  assert.match(
    html,
    /Это срок подачи заявки; он не заменяет регламент сдачи груза/
  );
});

test("route landing: logo stays on the landing and main site has a separate explicit link", () => {
  const html = read(page);
  const brand = html.match(/<a class="landing-shell__brand"([^>]+)>/)[1];
  assert.ok(brand.includes('href="' + page + '"'));
  assert.doesNotMatch(brand, /target=|главная страница сайта|новой вкладке/);
  assert.match(
    brand,
    /aria-label="Берг Транспортная компания — начало страницы направления"/
  );
  const site = html.match(
    /<a class="landing-shell__site-link"([^>]+)>([\s\S]*?)<\/a>/
  );
  assert.ok(site);
  assert.match(site[1], /href="home.html"/);
  assert.match(site[1], /target="_blank" rel="noopener"/);
  assert.doesNotMatch(site[1], /aria-label=/);
  assert.match(site[1], /title="Откроется в новой вкладке"/);
  assert.match(site[2], /Основной сайт/);
  assert.match(site[2], /Все направления и услуги/);
  assert.match(site[2], /aria-hidden="true" focusable="false"/);
  assert.equal(
    (html.match(/class="landing-shell__site-link"/g) || []).length,
    1
  );
});

test("route landing: other document links open a safe new tab; logo, anchors and phones stay native", () => {
  const html = read(page);
  const links = [...html.matchAll(/<a\b([^>]+)>/g)];
  let outgoing = 0;
  for (const [, attributes] of links) {
    const href = attributes.match(/href="([^"]+)"/)?.[1];
    assert.ok(href);
    if (href === page || /^(#|tel:|mailto:)/.test(href)) {
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
    /class="landing-shell__brand" href="vladivostok-khabarovsk.html" aria-label=/
  );
});
