import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync, existsSync} from "node:fs";

const directory = new URL("../public/", import.meta.url);
const page = "khabarovsk-vladivostok.html";
const html = readFileSync(new URL(page, directory), "utf8");
const section = (id) =>
  html.match(
    new RegExp(`<section[^>]*id="${id}"[^>]*>([\\s\\S]*?)</section>`)
  )[1];
const text = (value) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");

test("khb-vvo: own shell, metadata, schedule and prepared-cargo accent", () => {
  assert.match(html, /href="https:\/\/bergvl.ru\/khabarovsk-vladivostok.html"/);
  assert.match(html, /<title>Грузоперевозки Хабаровск — Владивосток/);
  assert.match(html, /href="css\/landing.css"/);
  assert.match(html, /src="js\/landing.js"/);
  assert.match(html, /src="js\/route.js"/);
  assert.doesNotMatch(html, /js\/index.js|css\/style.css|data-forklift/);
  const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
  assert.equal(h1.length, 1);
  assert.equal(
    text(h1[0][1]).trim(),
    "Доставка грузов из Хабаровска во Владивосток"
  );
  assert.match(html, /<dt>Отправления<\/dt><dd[^>]*>по рабочим дням<\/dd>/);
  assert.match(html, /<dt>Обычно<\/dt><dd>За сутки<\/dd>/);
  assert.doesNotMatch(html, /route-landing__shipment-caption/);
  const shipment = html.match(
    /<svg[^>]*class="route-landing__shipment-art"[^>]*>[\s\S]*?<\/svg>/
  )[0];
  assert.doesNotMatch(shipment, /cargo-ground|<circle/);
  assert.match(html, /До 3 календарных суток/);
  assert.match(html, /От приёма груза на склад, для любого принятого груза/);
  assert.match(
    html,
    /<svg[^>]*class="route-landing__shipment-art"[^>]*aria-hidden="true"/
  );
  assert.match(
    html,
    /class="landing-shell__brand" href="khabarovsk-vladivostok.html"/
  );
});

test("khb-vvo: local reception, packaging restriction and correct receiving phone", () => {
  const reception = section("reception");
  const arrival = section("arrival");
  assert.match(reception, /1-я Благодатная, 11/);
  assert.doesNotMatch(html, /[Сс]обственн|[Сс]вои площадки/);
  assert.match(reception, /href="tel:\+79243302076"/);
  assert.match(reception, /href="tel:\+74212377339"/);
  assert.match(reception, /Приём грузов, Татьяна/);
  assert.match(reception, /Подготовьте упаковку до сдачи груза/);
  assert.doesNotMatch(
    html,
    /только во Владивостоке|услуга не предлагается|Можно заказать обрешётку/
  );
  assert.match(reception, /До 11:00/);
  assert.match(reception, /До 16:00/);
  assert.match(reception, /на подачу машины и на сдачу груза на терминал/);
  assert.match(reception, /После 11:00 отправка возможна при наличии места/);
  assert.match(arrival, /100-летия Владивостока, 161А/);
  assert.match(arrival, /href="tel:\+79243304409"/);
  assert.match(arrival, /Выдача груза, диспетчер Яна/);
  assert.match(arrival, /со вторых суток после прибытия/);
  assert.match(arrival, /200 руб.\/сутки за весь груз/);
  assert.match(arrival, /500 руб.\/м³ в сутки/);
  assert.doesNotMatch(
    html,
    /200 кг|каждый рабочий день|Это срок заявки на машину/
  );
  const ids = ["reception", "tariffs", "arrival", "dispatch", "questions"];
  ids.forEach((id, index) => {
    if (index)
      assert.ok(
        html.indexOf(`id="${ids[index - 1]}"`) < html.indexOf(`id="${id}"`)
      );
  });
});

test("khb-vvo: reverse-pair prices, four shared examples and visible exclusions", () => {
  const tariffs = section("tariffs");
  const amounts = [
    ...tariffs.matchAll(/<p class="route-landing__amount">([\s\S]*?)<\/p>/g)
  ].map(([, value]) => text(value).trim());
  assert.deepEqual(amounts, [
    "250 руб.",
    "350 руб.",
    "3 500 руб.",
    "1 400 руб."
  ]);
  const tables = [...tariffs.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)];
  assert.equal(tables.length, 3);
  const rates = tables.map(([, table]) =>
    [...table.matchAll(/<td>([^<]+)<\/td>/g)].map(([, value]) =>
      text(value).trim()
    )
  );
  assert.deepEqual(rates, [
    ["250", "350", "700"],
    ["7", "6", "5", "4,5"],
    ["1 400", "1 200", "1 000", "900"]
  ]);
  assert.match(tariffs, /datetime="2026-01-01"/);
  assert.match(tariffs, /не более|не больше 1 м³ и 1 м/);
  assert.match(tariffs, /Без надбавок за негабарит, ДВС и температурный режим/);
  assert.match(
    tariffs,
    /Забор со склада, доставка по адресу, погрузочно-разгрузочные работы и платное хранение в суммы не включены/
  );
  assert.ok(
    tariffs.indexOf("в суммы не включены") < tariffs.indexOf("<details")
  );
  assert.match(tariffs, /надбавка 30%/);
  assert.match(tariffs, /Верхняя граница обычного диапазона не включается/);
});

test("khb-vvo: four individual cargo illustrations preserve the shared visual language", () => {
  const icons = (content) =>
    [
      ...content.matchAll(
        /<svg[^>]*class="route-landing__cargo-icon"[^>]*>[\s\S]*?<\/svg>/g
      )
    ].map(([svg]) => svg);
  const artwork = icons(section("tariffs"));
  const standard = icons(
    readFileSync(new URL("vladivostok-khabarovsk.html", directory), "utf8")
  );
  assert.equal(artwork.length, 4);
  assert.equal(new Set(artwork).size, 4);
  artwork.forEach((svg, index) => {
    assert.notEqual(svg, standard[index]);
    assert.match(svg, /aria-hidden="true"/);
    assert.match(svg, /focusable="false"/);
    assert.match(svg, /route-landing__cargo-body/);
    assert.match(svg, /route-landing__cargo-label/);
    assert.doesNotMatch(svg, /<script|<image|<animate|\bhref=/i);
  });
});

test("khb-vvo: native links, route attribution, disclosures and no-JS fallback", () => {
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
      assert.match(attrs, /data-route-id="khb-vvo"/);
      assert.match(
        attrs,
        /data-cta-position="(hero|tariff|terminal|bottom|mobile)"/
      );
      if (!href.startsWith("tel:")) {
        const url = new URL(href, "https://bergvl.ru/");
        assert.equal(url.searchParams.get("origin"), "khb");
        assert.equal(url.searchParams.get("destination"), "vvo");
      }
    }
  }
  assert.equal((html.match(/data-route-goal="calculator"/g) || []).length, 4);
  assert.equal((html.match(/data-route-goal="order"/g) || []).length, 3);
  assert.equal((html.match(/<details\b/g) || []).length, 5);
  assert.match(section("questions"), /<h2>Вопросы по перевозке<\/h2>/);
  assert.doesNotMatch(html, /обратн|Можно использовать тариф Владивосток/);

  assert.match(html, /<noscript>/);
  assert.match(html, /data-collapse-tariffs hidden/);
  assert.match(html, /route-landing__mobile-action"[^>]*hidden/);
  assert.doesNotMatch(html, /<form|FAQPage/);
});

test("khb-vvo: general phone supports copying and related route stays inline", () => {
  assert.match(html, /Общий телефон<\/p><div class="route-landing__phone-row"/);
  assert.match(html, /data-copy-phone="\+74212377339"/);
  assert.equal((html.match(/class="route-landing__copy"/g) || []).length, 4);
  assert.match(
    section("questions"),
    /<p>Нужна отправка в другую сторону\? <a class="link"/
  );
  assert.doesNotMatch(
    section("questions"),
    /<p class="route-landing__related"/
  );
});
