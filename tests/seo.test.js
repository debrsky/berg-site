import {readFileSync, readdirSync} from "node:fs";
import {test} from "node:test";
import {strict as assert} from "node:assert";
import {validateSiteUrl, indexableCanonical} from "../gulp/sitemap.js";

const read = (name) =>
  readFileSync(new URL(`../public/${name}`, import.meta.url), "utf8");
const service = [
  "client-doc.html",
  "controls.html",
  "index.html",
  "order-ok.html"
];
const files = readdirSync(new URL("../public", import.meta.url)).filter(
  (name) => name.endsWith(".html")
);
const indexed = files.filter((name) => !service.includes(name));
const productionOrigin = "https://bergvl.ru";
const termsPage = "terms.html";
const orderPage = "order.html";
const robots = read("robots.txt");
const strip = (html) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

// These checks target the generated, quoted-attribute HTML produced by Pug.
test("SEO: 14 indexable pages have unique metadata, visible H1 and self-canonical", () => {
  assert.equal(indexed.length, 14);
  const titles = new Set();
  const descriptions = new Set();
  for (const file of indexed) {
    const html = read(file);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(
      /<meta name="description" content="([^"]+)"/i
    )?.[1];
    assert.ok(title && description, file);
    assert.ok(!titles.has(title), file);
    assert.ok(!descriptions.has(description), file);
    titles.add(title);
    descriptions.add(description);
    const h1 = [...html.matchAll(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/g)];
    assert.equal(h1.length, 1, file);
    assert.doesNotMatch(h1[0][1], /visually-hidden|\bhidden\b|display:\s*none/);
    assert.ok(strip(h1[0][2]).trim(), file);
    assert.doesNotMatch(h1[0][1], /logo__text/);
    assert.equal(
      indexableCanonical(html, productionOrigin, file),
      `https://bergvl.ru/${file}`
    );
    let previous = 0;
    for (const [, level] of html.matchAll(/<h([1-6])\b/g)) {
      assert.ok(
        Number(level) <= previous + 1,
        `${file}: skipped heading level`
      );
      previous = Number(level);
    }
  }
});

test("SEO: noindex and client document crawl restriction are preserved", () => {
  for (const file of service) {
    assert.match(read(file), /<meta name="robots" content="noindex/);
  }
  assert.equal(
    robots,
    readFileSync(new URL("../src/robots.txt", import.meta.url), "utf8")
  );
  assert.match(robots, /Disallow: \/client-doc\.html/);
  assert.match(robots, /Sitemap: https:\/\/bergvl\.ru\/sitemap\.xml/);
  const locs = [...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => m[1]
  );
  assert.deepEqual(
    locs,
    indexed.map((name) => `https://bergvl.ru/${name}`).sort()
  );
});

test("SEO: invalid SITE_URL fails explicitly", () => {
  assert.equal(validateSiteUrl("https://bergvl.ru/"), productionOrigin);
  for (const input of [
    undefined,
    "",
    "undefined",
    "/",
    "javascript:alert(1)",
    "http://bergvl.ru",
    "https://example.com",
    "https://bergvl.ru/subdir",
    "https://bergvl.ru/?a=b",
    "https://bergvl.ru/#top",
    "https://user:pass@bergvl.ru"
  ]) {
    assert.throws(() => validateSiteUrl(input), /SITE_URL/);
  }
  assert.equal(
    indexableCanonical(
      '<meta content="noindex" name="robots">',
      productionOrigin,
      "index.html"
    ),
    null
  );
  assert.throws(
    () =>
      indexableCanonical(
        '<link rel="canonical" href="home.html">',
        productionOrigin,
        "home.html"
      ),
    /canonical/
  );
  assert.throws(
    () =>
      indexableCanonical(
        '<link rel="canonical" href="https://bergvl.ru/home.html"><link rel="canonical" href="https://bergvl.ru/home.html">',
        productionOrigin,
        "home.html"
      ),
    /canonical/
  );
});

test("SEO: structured data contains only confirmed owned sites and no invented details", () => {
  for (const file of indexed) {
    const scripts = [
      ...read(file).matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
      )
    ];
    assert.equal(scripts.length, 1, file);
    const data = JSON.parse(scripts[0][1]);
    assert.equal(data["@context"], "https://schema.org");
    assert.equal(data["@graph"].length, 5);
    assert.equal(data["@graph"][0]["@type"], "Organization");
    const sites = data["@graph"].slice(1);
    assert.deepEqual(
      sites.map((site) => site.address.addressLocality),
      ["Владивосток", "Уссурийск", "Хабаровск", "Благовещенск"]
    );
    assert.doesNotMatch(
      scripts[0][1],
      /openingHours|rating|review|postalCode|Комсомольск/
    );
    for (const site of sites)
      assert.ok(read("contacts.html").includes(site.address.streetAddress));
  }
});

test("SEO: agreed schedule, reception, storage and editorial exclusions", () => {
  for (const file of ["home.html", "about.html"]) {
    const text = strip(read(file));
    assert.match(text, /Владивосток — Хабаровск — каждый рабочий день/);
    assert.match(text, /Хабаровск — Владивосток — по рабочим дням/);
    assert.match(text, /Владивосток — Благовещенск — по вторникам и пятницам/);
    assert.match(text, /Владивосток — Комсомольск-на-Амуре — еженедельно/);
  }
  for (const file of ["home.html", termsPage]) {
    const text = strip(read(file));
    assert.match(text, /11:00 по местному времени/);
    assert.match(
      text,
      /Владивосток — Хабаровск — обычно 1 сутки; гарантированный срок — до 3 календарных суток/
    );
    assert.match(
      text,
      /Хабаровск — Владивосток — обычно 1 сутки; гарантированный срок — до 3 календарных суток/
    );
    assert.match(
      text,
      /Владивосток — Благовещенск — обычно 3 суток; гарантированный срок — до 5 календарных суток/
    );
    assert.match(
      text,
      /Благовещенск — Владивосток — обычно 3 суток; гарантированный срок — до 5 календарных суток/
    );
    assert.match(text, /от приёма груза на склад/);
    assert.match(text, /Температурный режим — по согласованию/);
  }
  for (const file of [termsPage, "pricing.html"]) {
    const text = strip(read(file));
    assert.match(text, /До 1 м³ включительно — 200 руб.\/сутки за весь груз/);
    assert.match(text, /Свыше 1 м³ — 500 руб.\/м³ в сутки/);
    assert.match(text, /со вторых суток после прибытия/);
    assert.doesNotMatch(text, /200 кг|пяти дней|до даты отправки/);
  }
  for (const file of indexed.filter((name) => name !== orderPage)) {
    assert.doesNotMatch(
      strip(
        read(file).replace(
          /<details class="announcement__block">[\s\S]*?<\/details>/,
          ""
        )
      ),
      /страхован|страховк|от 1 кг|вторникам и четвергам|НДС\s*5\s*%/i,
      file
    );
  }
  assert.match(read(orderPage), /name="insurance"/);
});

test("SEO: terminal and warehouse options and next-day deadline are visible", () => {
  for (const file of ["home.html", termsPage]) {
    const text = strip(read(file));
    assert.match(
      text,
      /Заявку на завтра \(на подачу машины и на сдачу груза на терминал\) необходимо подать сегодня до 16:00/
    );
    assert.match(
      text,
      /отправить с терминала или заказать машину для забора груза со склада отправителя/
    );
    assert.match(
      text,
      /получить на терминале или заказать доставку до склада получателя/
    );
  }
  assert.match(
    strip(read(orderPage)),
    /Заявку на завтра \(на подачу машины и на сдачу груза на терминал\) необходимо подать сегодня до 16:00/
  );
});

test("SEO: packaging is offered only in Vladivostok on every relevant page", () => {
  for (const file of ["home.html", "about.html", termsPage, "package.html"]) {
    const html = read(file);
    const text = strip(html);
    assert.match(
      text,
      /Упаковку и обрешётку груза можно заказать только во Владивостоке/
    );
    assert.doesNotMatch(text, /Во Владивостоке и Хабаровске можно заказать/);
    assert.doesNotMatch(
      html,
      /Упаковка и обрешётка груза во Владивостоке и Хабаровске/
    );
  }
});

test("SEO: content images reserve space and only later home slides are lazy", () => {
  for (const file of indexed) {
    for (const [tag] of read(file).matchAll(/<img\b[^>]*>/g)) {
      if (tag.includes("mc.yandex.ru/watch")) continue;
      assert.match(tag, /width="\d+"/, file);
      assert.match(tag, /height="\d+"/, file);
    }
  }
  const slides = [
    ...read("home.html").matchAll(/<img class="swiper-slide-img"[^>]*>/g)
  ].map(([tag]) => tag);
  assert.equal(slides.length, 11);
  const sliderCss = read("css/swiper.css");
  assert.match(sliderCss, /object-fit:\s*contain/);
  assert.match(sliderCss, /height:\s*100%/);
  assert.doesNotMatch(
    read("css/style.css"),
    /\.home-content\s+\.swiper-slide-img/
  );
  assert.match(slides[0], /loading="eager"/);
  for (const tag of slides.slice(1)) assert.match(tag, /loading="lazy"/);
});
