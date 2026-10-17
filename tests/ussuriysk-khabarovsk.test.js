import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync, existsSync} from "node:fs";
import {routePages, validContext} from "../src/js/common/route.js";

const directory = new URL("../public/", import.meta.url);
const page = "ussuriysk-khabarovsk.html";
const html = readFileSync(new URL(page, directory), "utf8");
const text = (value) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

test("uss-khb: standalone landing, own schematic and no unconfirmed schedule", () => {
  assert.match(html, /<title>Грузоперевозки Уссурийск — Хабаровск/);
  assert.match(html, /href="https:\/\/bergvl.ru\/ussuriysk-khabarovsk.html"/);
  assert.match(
    html,
    /class="landing-shell__brand" href="ussuriysk-khabarovsk.html"/
  );
  assert.match(html, /href="css\/landing.css"/);
  assert.match(html, /src="js\/landing.js"/);
  assert.match(html, /src="js\/route.js"/);
  assert.match(
    html,
    /<svg[^>]*class="route-landing__illustration"[^>]*aria-hidden="true"/
  );
  assert.match(html, /Согласуем перед отправкой/);
  assert.match(html, /На терминале или по адресу/);
  assert.doesNotMatch(html, /[Сс]обственн[^<]*площад/);
  assert.match(html, /data-route-scene/);
  assert.match(html, /data-route-line/);
  assert.match(html, /data-route-parcel/);
  assert.doesNotMatch(
    html,
    /data-forklift|js\/index.js|css\/style.css|ежедневно|каждый рабочий день|За сутки|До 3 календарных|undefined|NaN/
  );
  const headings = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
  assert.equal(headings.length, 1);
  assert.equal(text(headings[0][1]), "Грузоперевозки Уссурийск — Хабаровск");
  assert.match(html, /До 11:00/);
  assert.match(html, /До 16:00/);
  assert.match(html, /на подачу машины и на сдачу груза на терминал/);
  assert.match(html, /Время приёма на терминал не является расписанием рейсов/);
});

test("uss-khb: own pair prices and honest exclusions", () => {
  const amounts = [
    ...html.matchAll(/<p class="route-landing__amount">([\s\S]*?)<\/p>/g)
  ].map(([, value]) => text(value));
  assert.deepEqual(amounts, [
    "250 руб.",
    "500 руб.",
    "4 750 руб.",
    "1 900 руб."
  ]);
  const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)];
  assert.equal(tables.length, 3);
  assert.deepEqual(
    tables.map(([, table]) =>
      [...table.matchAll(/<td>([^<]+)<\/td>/g)].map(([, value]) => text(value))
    ),
    [
      ["250", "500", "950"],
      ["9,5", "8", "7,5", "7"],
      ["1 900", "1 600", "1 500", "1 400"]
    ]
  );
  assert.match(html, /Между терминалами, включая НДС/);
  assert.match(
    html,
    /погрузочно-разгрузочные работы и платное хранение оплачиваются отдельно/
  );
  assert.match(html, /datetime="2026-01-01"/);
  assert.match(html, /надбавка 30%/);
});

test("uss-khb: four individual cargo icons retain shared styling and accessibility", () => {
  const icons = (content) =>
    [
      ...content.matchAll(
        /<svg[^>]*class="route-landing__cargo-icon"[^>]*>[\s\S]*?<\/svg>/g
      )
    ].map(([svg]) => svg);
  const artwork = icons(html);
  assert.equal(artwork.length, 4);
  assert.equal(new Set(artwork).size, 4);
  const otherIcons = [
    "vladivostok-khabarovsk.html",
    "khabarovsk-vladivostok.html"
  ].flatMap((name) => icons(readFileSync(new URL(name, directory), "utf8")));
  artwork.forEach((svg) => {
    assert.ok(!otherIcons.includes(svg));
    assert.match(svg, /aria-hidden="true"/);
    assert.match(svg, /focusable="false"/);
    assert.match(svg, /viewBox="0 0 56 56"/);
    assert.match(svg, /route-landing__cargo-body/);
    assert.match(svg, /route-landing__cargo-label/);
    assert.doesNotMatch(svg, /<script|<image|<animate|\bhref=/i);
  });
});

test("uss-khb: sending and receiving contacts, maps and cargo preparation", () => {
  assert.match(html, /Сельскохозяйственная, 16А/);
  assert.match(html, /1-я Благодатная, 11/);
  assert.match(html, /href="tel:\+79243307799"/);
  assert.match(html, /href="tel:\+79842953632"/);
  assert.match(html, /Выдача грузов, Елена/);
  assert.match(html, /pt=131.915237,43.800389/);
  assert.match(html, /pt=135.145785,48.482212/);
  assert.doesNotMatch(
    html,
    /[Оо]бреш[её]тк|услуга не предлагается|заказать упаковку|[Вв]о Уссурийске/
  );
  assert.match(html, /подготовьте груз до передачи на терминал/);
  assert.match(html, /требования к упаковке/);
  assert.doesNotMatch(
    html,
    /tel:\+79243304405|tel:\+79243304409|Обратн|обратн/
  );
});

test("uss-khb: native links, route parameters, analytics and disclosures", () => {
  for (const [, attrs] of html.matchAll(/<a\b([^>]+)>/g)) {
    const href = attrs.match(/href="([^"]+)"/)[1].replaceAll("&amp;", "&");
    if (/^(#|tel:)/.test(href) || href === page) {
      assert.doesNotMatch(attrs, /target=/);
    } else {
      assert.match(attrs, /target="_blank" rel="noopener"/);
      assert.match(attrs, /title="Откроется в новой вкладке"/);
    }
    if (!/^(https?:|tel:|#)/.test(href)) {
      assert.ok(existsSync(new URL(href.split(/[?#]/)[0], directory)), href);
    }
    if (attrs.includes("data-route-goal=")) {
      assert.match(attrs, /data-route-id="uss-khb"/);
      assert.match(
        attrs,
        /data-cta-position="(hero|tariff|terminal|bottom|mobile)"/
      );
      if (!href.startsWith("tel:")) {
        const url = new URL(href, "https://bergvl.ru/");
        assert.equal(url.searchParams.get("origin"), "uss");
        assert.equal(url.searchParams.get("destination"), "khb");
      }
    }
  }
  assert.equal((html.match(/data-route-goal="calculator"/g) || []).length, 4);
  assert.equal((html.match(/data-route-goal="order"/g) || []).length, 3);
  assert.equal((html.match(/<details\b/g) || []).length, 6);
  assert.match(html, /<noscript>/);
  assert.match(html, /data-collapse-tariffs hidden/);
  assert.match(html, /route-landing__mobile-action"[^>]*hidden/);
  assert.equal(routePages["uss-khb"], "ussuriysk-khabarovsk");
  assert.ok(
    validContext({
      route_id: "uss-khb",
      source_page: "ussuriysk-khabarovsk",
      time: Date.now()
    })
  );
  assert.match(
    readFileSync(new URL("sitemap.xml", directory), "utf8"),
    /<loc>https:\/\/bergvl.ru\/ussuriysk-khabarovsk.html<\/loc>/
  );
});
