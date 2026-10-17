import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync, readdirSync, existsSync} from "node:fs";
import {tariffs} from "./helpers/landing-data.js";
import {calculateCargo} from "../src/js/common/calculate.js";
import {routePages, validContext} from "../src/js/common/route.js";

const directory = new URL("../public/", import.meta.url);
const read = (file) => readFileSync(new URL(file, directory), "utf8");
const plain = (value) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const komsomolskPhone = "+79244114161";
const routes = [
  {
    slug: "vladivostok-komsomolsk-na-amure",
    origin: "vvo",
    destination: "kms",
    sending: "+79243304405",
    receiving: komsomolskPhone,
    amounts: [350, 850, 8500, 3400],
    weekly: true
  },
  {
    slug: "ussuriysk-komsomolsk-na-amure",
    origin: "uss",
    destination: "kms",
    sending: "+79243307799",
    receiving: komsomolskPhone,
    amounts: [350, 800, 7750, 3100]
  },
  {
    slug: "ussuriysk-blagoveshchensk",
    origin: "uss",
    destination: "blg",
    sending: "+79243307799",
    receiving: "+79248411208",
    amounts: [350, 850, 8250, 3300]
  },
  {
    slug: "blagoveshchensk-komsomolsk-na-amure",
    origin: "blg",
    destination: "kms",
    sending: "+79248411208",
    receiving: komsomolskPhone,
    amounts: [250, 700, 7000, 2800]
  },
  {
    slug: "komsomolsk-na-amure-vladivostok",
    origin: "kms",
    destination: "vvo",
    sending: komsomolskPhone,
    receiving: "+79243304409",
    amounts: [200, 400, 4000, 1600],
    weekly: true
  }
];
const section = (html, id) =>
  html.match(
    new RegExp(`<section[^>]*id="${id}"[^>]*>([\\s\\S]*?)</section>`)
  )[1];
const icons = (html) =>
  [
    ...html.matchAll(
      /<svg class="route-landing__cargo-icon"[^>]*>[\s\S]*?<\/svg>/g
    )
  ].map(([svg]) => svg);
const geometry = (svg) =>
  [...svg.matchAll(/\bd="([^"]+)"/g)].map(([, d]) => d).join("|");

for (const route of routes) {
  const {slug, origin, destination, sending, receiving, amounts, weekly} =
    route;
  const file = slug + ".html";
  const html = read(file);
  const id = origin + "-" + destination;
  const name = tariffs.places[origin] + " — " + tariffs.places[destination];

  test(`${id}: standalone content, confirmed schedule and original animated scene`, () => {
    assert.equal(
      plain(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]),
      "Грузоперевозки " + name
    );
    assert.match(
      html,
      new RegExp(`rel="canonical" href="https://bergvl.ru/${slug}.html"`)
    );
    assert.ok(html.includes(`class="landing-shell__brand" href="${file}"`));
    for (const asset of ["css/landing.css", "js/landing.js", "js/route.js"])
      assert.ok(html.includes(asset));
    assert.doesNotMatch(html, /js\/index.js|css\/style.css|data-forklift/);
    assert.doesNotMatch(
      plain(html),
      /[Сс]обственн|[Сс]вои площадки|обратн|обычно \d|календарных суток|по рабочим дням|по вторникам/i
    );
    if (weekly) assert.match(plain(html), /Рейсы еженедельно/);
    else assert.doesNotMatch(plain(html), /еженедельно/);
    assert.match(plain(html), /Срок доставки Уточните перед отправкой/);
    const scene = html.match(
      /<svg class="route-landing__illustration"[\s\S]*?<\/svg>/
    )[0];
    assert.match(scene, /data-route-scene/);
    assert.match(scene, /data-route-line pathLength="1"/);
    assert.match(scene, /<g data-route-parcel/);
    assert.match(scene, /aria-hidden="true" focusable="false"/);
    assert.doesNotMatch(scene, /<script|<image|<animate|\bhref=/i);
    assert.ok(existsSync(new URL(`img/route-${slug}.svg`, directory)));
  });

  test(`${id}: examples and all tariff rows come from the correct pair`, () => {
    const block = section(html, "tariffs");
    const actual = [
      ...block.matchAll(/<p class="route-landing__amount">([\s\S]*?)<\/p>/g)
    ].map(([, value]) => Number(plain(value).replace(/\D/g, "")));
    assert.deepEqual(actual, amounts);
    [
      [0.3, 0.001],
      [10, 0.1],
      [500, 1],
      [100, 1]
    ].forEach(([weight, volume], index) => {
      assert.equal(
        calculateCargo(tariffs, {
          origin,
          destination,
          weight,
          volume,
          params: []
        }).amount,
        actual[index]
      );
    });
    const rates = [...block.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)].map(
      ([, table]) =>
        [...table.matchAll(/<td>([^<]+)<\/td>/g)].map(([, value]) =>
          Number(value.replace(/\s/g, "").replace(",", "."))
        )
    );
    const expected = [
      tariffs.minPrices,
      tariffs.heavyCargoPrices,
      tariffs.lightCargoPrices
    ].map((rows) =>
      Array.from(
        rows.filter((row) => row.price),
        (row) => row.price[origin][destination]
      )
    );
    assert.deepEqual(rates, expected);
    const visible = plain(block.split("<details")[0]);
    assert.match(visible, /Между терминалами, включая НДС/);
    assert.match(visible, /не больше 1 м³ и 1 м/);
    assert.match(visible, /оплачиваются отдельно/);
    assert.match(block, /надбавка 30%/);
    assert.match(block, /datetime="2026-01-01"/);
  });

  test(`${id}: contact roles, addresses, services and operational cutoffs`, () => {
    const terminals = section(html, "terminals");
    const [send, receive] = terminals.split(
      "route-landing__terminal-label--destination"
    );
    for (const [block, code, phone] of [
      [send, origin, sending],
      [receive, destination, receiving]
    ]) {
      assert.ok(block.includes(tariffs.terminals[code]));
      assert.ok(block.includes(`href="tel:${phone}"`));
      assert.ok(block.includes(`contacts.html#${code}`));
      const map = block.match(/href="(https:\/\/yandex.ru\/maps\/[^"]+)"/)[1];
      assert.ok(
        decodeURIComponent(map).includes(
          tariffs.places[code] + ", " + tariffs.terminals[code]
        )
      );
    }
    const header = html.match(
      /<header class="landing-shell__header">([\s\S]*?)<\/header>/
    )[1];
    assert.ok(header.includes(`href="tel:${sending}"`));
    assert.match(plain(html), /До 11:00/);
    assert.match(plain(html), /До 16:00/);
    assert.match(plain(html), /на подачу машины и на сдачу груза на терминал/);
    assert.match(plain(html), /Время местное/);
    assert.match(section(html, "questions"), /со вторых суток после прибытия/);
    assert.match(section(html, "questions"), /200 руб.\/сутки за весь груз/);
    assert.match(section(html, "questions"), /500 руб.\/м³ в сутки/);
    if (origin === "vvo") assert.match(plain(html), /Упаковка и обрешётка/);
    else {
      assert.match(plain(html), /Подготовьте упаковку до сдачи груза/);
      assert.doesNotMatch(plain(html), /обрешётк|только во Владивостоке/);
    }
  });

  test(`${id}: links, route prefill, analytics, no-JS and incoming discovery`, () => {
    assert.equal(routePages[id], slug);
    const time = Date.now();
    assert.ok(validContext({route_id: id, source_page: slug, time}, time));
    // Shared links/prefill assertions run for all fifteen routes in landing-contract.test.js.
    assert.equal((html.match(/data-route-goal="calculator"/g) || []).length, 4);
    assert.equal((html.match(/data-route-goal="order"/g) || []).length, 3);
    assert.equal((html.match(/<details\b/g) || []).length, 6);
    assert.match(html, /<noscript>/);
    assert.match(html, /data-collapse-tariffs hidden/);
    assert.match(html, /route-landing__mobile-action"[^>]*hidden/);
    for (const entry of ["home.html", "pricing.html"])
      assert.ok(read(entry).includes(`href="${file}"`));
    assert.ok(
      read("sitemap.xml").includes(`<loc>https://bergvl.ru/${file}</loc>`)
    );
  });
}

test("Remaining routes: twenty individual cargo silhouettes and five different hero scenes", () => {
  const all = readdirSync(directory).filter(
    (file) =>
      file.endsWith(".html") && read(file).includes('class="route-landing"')
  );
  const existing = all
    .filter((file) => !routes.some((route) => file === route.slug + ".html"))
    .flatMap((file) => icons(read(file)))
    .map(geometry);
  const added = routes.flatMap((route) => icons(read(route.slug + ".html")));
  assert.equal(added.length, 20);
  assert.equal(new Set(added.map(geometry)).size, 20);
  for (const icon of added) {
    assert.ok(!existing.includes(geometry(icon)));
    assert.match(icon, /aria-hidden="true" focusable="false"/);
    assert.match(icon, /route-landing__cargo-label/);
    assert.doesNotMatch(icon, /<script|<image|<animate|\bhref=/i);
  }
  const scenes = routes.map(
    (route) =>
      read(route.slug + ".html").match(
        /<svg class="route-landing__illustration"[\s\S]*?<\/svg>/
      )[0]
  );
  assert.equal(new Set(scenes.map(geometry)).size, 5);
  // Every priced pair now has an actual landing, not just an analytics entry.
  for (const [origin, destinations] of Object.entries(
    tariffs.heavyCargoPrices[0].price
  )) {
    for (const destination of Object.keys(destinations)) {
      const page = routePages[origin + "-" + destination];
      assert.ok(page && existsSync(new URL(page + ".html", directory)));
    }
  }
});
