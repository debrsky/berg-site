import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
import {tariffs} from "./helpers/landing-data.js";
import {calculateCargo} from "../src/js/common/calculate.js";
import {routePages, validContext} from "../src/js/common/route.js";

const directory = new URL("../public/", import.meta.url);
const page = "khabarovsk-ussuriysk.html";
const html = readFileSync(new URL(page, directory), "utf8");
const text = (value) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const section = (id) =>
  html.match(
    new RegExp(`<section[^>]*id="${id}"[^>]*>([\\s\\S]*?)</section>`)
  )[1];

test("khb-uss: independent metadata, shared shell and original illustration", () => {
  assert.match(html, /<title>Грузоперевозки Хабаровск — Уссурийск/);
  assert.match(
    html,
    /rel="canonical" href="https:\/\/bergvl.ru\/khabarovsk-ussuriysk.html"/
  );
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal(
    text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]),
    "Грузоперевозки Хабаровск — Уссурийск"
  );
  assert.match(
    html,
    /class="landing-shell__brand" href="khabarovsk-ussuriysk.html"/
  );
  assert.match(html, /css\/landing.css/);
  assert.match(html, /js\/landing.js/);
  assert.match(html, /js\/route.js/);
  assert.doesNotMatch(html, /js\/index.js|css\/style.css|data-forklift/);
  const illustration = html.match(
    /<svg class="route-landing__illustration"[\s\S]*?<\/svg>/
  )[0];
  assert.match(illustration, /aria-hidden="true" focusable="false"/);
  assert.match(illustration, /data-route-scene/);
  assert.match(illustration, /data-route-line="" pathLength="1"/);
  assert.match(illustration, /<g data-route-parcel="">/);
  assert.doesNotMatch(illustration, /<script|<image|<animate|\bhref=/i);
  assert.match(text(html), /Согласуем перед отправкой/);
  assert.doesNotMatch(text(html), /[Сс]обственн|[Сс]вои площадки/);
  assert.doesNotMatch(
    text(html),
    /За сутки|До 3 календарных|по рабочим дням|обратн/i
  );
});

test("khb-uss: individual cargo icons differ from every other landing series", () => {
  const icons = (content) =>
    [
      ...content.matchAll(
        /<svg[^>]*class="route-landing__cargo-icon"[^>]*>[\s\S]*?<\/svg>/g
      )
    ].map(([svg]) => svg);
  const artwork = icons(section("tariffs"));
  assert.equal(artwork.length, 4);
  assert.equal(new Set(artwork).size, 4);
  const otherIcons = [
    "vladivostok-khabarovsk.html",
    "khabarovsk-vladivostok.html",
    "ussuriysk-khabarovsk.html"
  ].flatMap((file) => icons(readFileSync(new URL(file, directory), "utf8")));
  // Ignore comments and whitespace: uniqueness must come from the actual drawing.
  const geometry = (svg) =>
    [...svg.matchAll(/\bd="([^"]+)"/g)].map(([, d]) => d).join("|");
  artwork.forEach((svg) => {
    assert.ok(otherIcons.every((other) => geometry(other) !== geometry(svg)));
    assert.match(svg, /aria-hidden="true" focusable="false"/);
    assert.match(svg, /route-landing__cargo-body/);
    assert.match(svg, /route-landing__cargo-label/);
    assert.doesNotMatch(svg, /<script|<image|<animate|\bhref=/i);
  });
});

test("khb-uss: own pair prices and tariff boundaries", () => {
  const content = section("tariffs");
  const amounts = [
    ...content.matchAll(/<p class="route-landing__amount">([\s\S]*?)<\/p>/g)
  ].map(([, value]) => Number(text(value).replace(/\D/g, "")));
  const samples = [
    [0.3, 0.001],
    [10, 0.1],
    [500, 1],
    [100, 1]
  ];
  assert.deepEqual(amounts, [250, 350, 3250, 1300]);
  samples.forEach(([weight, volume], index) => {
    assert.equal(
      calculateCargo(tariffs, {
        origin: "khb",
        destination: "uss",
        weight,
        volume,
        params: []
      }).amount,
      amounts[index]
    );
  });
  const rates = [...content.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)].map(
    ([, table]) =>
      [...table.matchAll(/<td>([^<]+)<\/td>/g)].map(([, value]) => text(value))
  );
  assert.deepEqual(rates, [
    ["250", "350", "650"],
    ["6,5", "5,5", "4,5", "4"],
    ["1 300", "1 100", "900", "800"]
  ]);
  assert.match(content, /datetime="2026-01-01"/);
  const visible = content.split("<details")[0];
  assert.match(visible, /Между терминалами, включая НДС/);
  assert.match(visible, /не больше 1 м³ и 1 м/);
  assert.match(visible, /оплачиваются отдельно/);
  assert.match(content, /надбавка 30%/);
});

test("khb-uss: correct terminals, phone roles and confirmed operational rules", () => {
  const terminals = section("terminals");
  const [sending, receiving] = terminals.split(
    "route-landing__terminal-label--destination"
  );
  assert.match(sending, /1-я Благодатная, 11/);
  assert.match(sending, /tel:\+79243302076/);
  assert.match(sending, /Приём грузов, Татьяна/);
  assert.match(sending, /tel:\+74212377339/);
  assert.match(receiving, /Сельскохозяйственная, 16А/);
  assert.match(receiving, /tel:\+79243307799/);
  assert.match(receiving, /contacts.html#uss/);
  assert.doesNotMatch(html, /tel:\+79842953632|tel:\+79243304409/);
  assert.match(text(html), /До 11:00/);
  assert.match(text(html), /До 16:00/);
  assert.match(text(html), /на подачу машины и на сдачу груза на терминал/);
  assert.match(text(html), /Упакуйте груз до сдачи в Хабаровске/);
  assert.doesNotMatch(
    text(html),
    /только во Владивостоке|Можно ли заказать упаковку в Хабаровске/
  );
  assert.match(section("questions"), /со вторых суток после прибытия/);
  assert.match(section("questions"), /200 руб.\/сутки за весь груз/);
  assert.match(section("questions"), /500 руб.\/м³ в сутки/);
});

test("khb-uss: links, no-JS disclosures, route prefill and analytics registration", () => {
  // Shared link/prefill checks run for all routes in landing-contract.test.js.
  assert.equal(routePages["khb-uss"], "khabarovsk-ussuriysk");
  const now = Date.now();
  assert.ok(
    validContext(
      {route_id: "khb-uss", source_page: routePages["khb-uss"], time: now},
      now
    )
  );
  assert.equal((html.match(/data-route-goal="calculator"/g) || []).length, 4);
  assert.equal((html.match(/data-route-goal="order"/g) || []).length, 3);
  assert.equal((html.match(/<details\b/g) || []).length, 6);
  assert.match(html, /<noscript>/);
  assert.match(html, /data-collapse-tariffs hidden/);
  assert.match(html, /route-landing__mobile-action"[^>]*hidden/);
  assert.match(
    readFileSync(new URL("home.html", directory), "utf8"),
    /href="khabarovsk-ussuriysk.html"/
  );
});
