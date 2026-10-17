import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync, existsSync, readdirSync} from "node:fs";
import {tariffs} from "./helpers/landing-data.js";
import {calculateCargo} from "../src/js/common/calculate.js";
import {routePages, validContext} from "../src/js/common/route.js";

const directory = new URL("../public/", import.meta.url);
const page = "vladivostok-blagoveshchensk.html";
const read = (name) => readFileSync(new URL(name, directory), "utf8");
const html = read(page);
const text = (value) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const section = (id) =>
  html.match(
    new RegExp(`<section[^>]*id="${id}"[^>]*>([\\s\\S]*?)</section>`)
  )[1];

test("vvo-blg: independent metadata, shared shell and weekly dispatch illustration", () => {
  assert.match(html, /<title>Грузоперевозки Владивосток — Благовещенск/);
  assert.match(
    html,
    /rel="canonical" href="https:\/\/bergvl.ru\/vladivostok-blagoveshchensk.html"/
  );
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal(
    text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]),
    "Грузоперевозки Владивосток — Благовещенск"
  );
  assert.match(
    html,
    /class="landing-shell__brand" href="vladivostok-blagoveshchensk.html"/
  );
  for (const asset of ["css/landing.css", "js/landing.js", "js/route.js"])
    assert.ok(html.includes(asset));
  assert.doesNotMatch(html, /js\/index.js|css\/style.css|data-forklift/);
  assert.match(html, /href="blagoveshchensk-vladivostok.html"/);
  const illustration = html.match(
    /<svg class="route-landing__illustration"[\s\S]*?<\/svg>/
  )[0];
  assert.match(
    illustration,
    /aria-hidden="true" focusable="false" data-route-scene/
  );
  assert.match(illustration, /data-route-line pathLength="1"/);
  assert.match(illustration, /<g data-route-parcel/);
  assert.match(illustration, /Вторник/);
  assert.match(illustration, /Пятница/);
  assert.match(illustration, /Дни отправления/);
  assert.equal((illustration.match(/data-departure-day=/g) || []).length, 2);
  assert.match(illustration, /data-departure-day="tuesday"/);
  assert.match(illustration, /data-departure-day="friday"/);
  const arrows = illustration.match(/data-route-line[^>]* d="([^"]+)"/)[1];
  // Each day has its own arrow; never draw a continuous Tuesday–Friday route.
  assert.equal((arrows.match(/M/g) || []).length, 2);
  assert.doesNotMatch(illustration, /<script|<image|<animate|\bhref=/i);
  const visible = text(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, ""));
  assert.doesNotMatch(
    visible,
    /ежедневно|каждый рабочий день|обратн|собственн|свои площадки/i
  );
  const order = [
    "planning",
    "dispatch",
    "tariffs",
    "terminals",
    "questions"
  ].map((id) => html.indexOf(`id="${id}"`));
  assert.ok(order.every((value, index) => value > (order[index - 1] ?? -1)));
  assert.match(
    read("sitemap.xml"),
    /https:\/\/bergvl.ru\/vladivostok-blagoveshchensk.html/
  );
  assert.match(read("home.html"), /href="vladivostok-blagoveshchensk.html"/);
});

test("vvo-blg: confirmed schedule, distinct deadlines and preparation", () => {
  const planning = text(section("planning"));
  assert.match(planning, /по вторникам и пятницам/);
  assert.match(planning, /До 11:00/);
  assert.match(planning, /11:00 по местному времени/);
  assert.match(planning, /До 16:00/);
  assert.match(planning, /на подачу машины и на сдачу груза на терминал/);
  assert.match(planning, /Обычно доставка занимает 3 суток/);
  assert.match(
    planning,
    /Гарантированный срок — до 5 календарных суток от приёма груза для любого принятого груза/
  );
  assert.match(
    planning,
    /Заявка на машину не означает отправку груза в тот же день/
  );
  assert.match(section("dispatch"), /только во Владивостоке/);
  assert.match(section("dispatch"), /Температурный режим — по согласованию/);
  assert.match(html, /href="#sending-terminal"/);
  assert.match(html, /id="sending-terminal"[^>]*tabindex="-1"/);
});

test("vvo-blg: prices calculated for the correct pair and tariff boundaries", () => {
  const content = section("tariffs");
  const amounts = [
    ...content.matchAll(/<p class="route-landing__amount">([\s\S]*?)<\/p>/g)
  ].map(([, value]) => Number(text(value).replace(/\D/g, "")));
  assert.deepEqual(amounts, [350, 850, 8500, 3400]);
  [
    [0.3, 0.001],
    [10, 0.1],
    [500, 1],
    [100, 1]
  ].forEach(([weight, volume], index) => {
    assert.equal(
      calculateCargo(tariffs, {
        origin: "vvo",
        destination: "blg",
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
    ["350", "850", "1 700"],
    ["17", "16,5", "16", "15,5"],
    ["3 400", "3 300", "3 200", "3 100"]
  ]);
  assert.match(content, /datetime="2026-01-01"/);
  const visible = content.split("<details")[0];
  assert.match(visible, /Между терминалами, включая НДС/);
  assert.match(visible, /не больше 1 м³ и 1 м/);
  assert.match(
    visible,
    /упаковка, погрузочно-разгрузочные работы и платное хранение оплачиваются отдельно/
  );
  assert.match(content, /надбавка 30%/);
  assert.match(content, /Верхняя граница обычного диапазона не включается/);
});

test("vvo-blg: individual cargo drawings and correct terminal contacts", () => {
  const icons = (content) =>
    [
      ...content.matchAll(
        /<svg[^>]*class="route-landing__cargo-icon"[^>]*>[\s\S]*?<\/svg>/g
      )
    ].map(([svg]) => svg);
  const geometry = (svg) =>
    [...svg.matchAll(/\bd="([^"]+)"/g)].map(([, d]) => d).join("|");
  const own = icons(section("tariffs"));
  assert.equal(own.length, 4);
  assert.equal(new Set(own.map(geometry)).size, 4);
  const others = readdirSync(directory)
    .filter((name) => name.endsWith(".html") && name !== page)
    .flatMap((name) => icons(read(name)));
  own.forEach((svg) => {
    assert.ok(others.every((other) => geometry(other) !== geometry(svg)));
    assert.match(svg, /aria-hidden="true" focusable="false"/);
    assert.doesNotMatch(svg, /<script|<image|<animate|\bhref=/i);
  });
  const [sending, receiving] = section("terminals").split(
    "route-landing__terminal-label--destination"
  );
  assert.match(sending, /100-летия Владивостока, 161А/);
  assert.match(sending, /tel:\+79243304405/);
  assert.match(sending, /Отправка груза, диспетчер Евгений/);
  assert.match(sending, /contacts.html#vvo/);
  assert.match(receiving, /Чехова, 3/);
  assert.match(receiving, /tel:\+79248411208/);
  assert.match(receiving, /Наталья/);
  assert.match(receiving, /contacts.html#blg/);
  assert.match(receiving, /со вторых суток после прибытия/);
  assert.match(receiving, /200 руб.\/сутки за весь груз/);
  assert.match(receiving, /500 руб.\/м³ в сутки/);
  assert.doesNotMatch(html, /tel:\+79243304409|tel:\+79243302076/);
});

test("vvo-blg: native links and existing destinations", () => {
  for (const [, attrs] of html.matchAll(/<a\b([^>]+)>/g)) {
    const href = attrs.match(/href="([^"]+)"/)[1].replaceAll("&amp;", "&");
    if (/^(#|tel:)/.test(href) || href === page) {
      assert.doesNotMatch(attrs, /target=/);
    } else {
      assert.match(attrs, /target="_blank" rel="noopener"/);
      assert.match(attrs, /title="Откроется в новой вкладке"/);
    }
    if (!/^(https?:|tel:|#)/.test(href))
      assert.ok(existsSync(new URL(href.split(/[?#]/)[0], directory)), href);
    if (href === "#sending-terminal")
      assert.doesNotMatch(attrs, /data-route-goal/);
  }
});

test("vvo-blg: no-JS content, route prefill and analytics context", () => {
  // Shared attribution/prefill checks run in landing-contract.test.js.
  assert.equal(routePages["vvo-blg"], "vladivostok-blagoveshchensk");
  const now = Date.now();
  assert.ok(
    validContext(
      {route_id: "vvo-blg", source_page: routePages["vvo-blg"], time: now},
      now
    )
  );
  assert.equal((html.match(/data-route-goal="calculator"/g) || []).length, 4);
  assert.equal((html.match(/data-route-goal="order"/g) || []).length, 3);
  assert.equal((html.match(/<details\b/g) || []).length, 7);
  assert.match(html, /<noscript>/);
  assert.match(html, /data-collapse-tariffs hidden/);
  assert.match(html, /route-landing__mobile-action"[^>]*hidden/);
});
