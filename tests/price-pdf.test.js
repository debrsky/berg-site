import {test} from "node:test";
import {strict as assert} from "node:assert";
import {mkdtemp, readFile, readdir, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import pug from "pug";
import {PDFDocument} from "pdf-lib";
import {
  generatePricePdf,
  renderPriceHtml,
  validatePricePdf
} from "../scripts/generate-price-pdf.js";
import {tariffs, business} from "./helpers/landing-data.js";

const previewFilename = "price.html";

test("Price PDF: all directed pairs and every tariff come from the site data", async () => {
  const html = await renderPriceHtml();
  const rows = [
    ...html.matchAll(/<tr\b[^>]*data-route="([^"]+)"[^>]*>(.*?)<\/tr>/g)
  ];
  const expectedPairs = Object.entries(
    tariffs.heavyCargoPrices[0].price
  ).flatMap(([origin, destinations]) =>
    Object.keys(destinations).map((destination) => origin + "-" + destination)
  );
  assert.deepEqual(
    rows.map((row) => row[1]),
    expectedPairs
  );
  for (const [, pair, content] of rows) {
    const [origin, destination] = pair.split("-");
    for (const [id, prices] of [
      ["heavy", tariffs.heavyCargoPrices],
      ["light", tariffs.lightCargoPrices],
      ["minimum", tariffs.minPrices]
    ]) {
      const priced = prices.filter((row) => row.price);
      for (const [column, row] of priced.entries()) {
        const value = row.price[origin][destination];
        const formatted = new Intl.NumberFormat("ru-RU").format(value);
        assert.ok(
          content.includes(
            'data-tariff="' + id + "-" + column + '">' + formatted + "</td>"
          ),
          pair + " " + id + "-" + column + ": " + formatted
        );
      }
    }
  }
  assert.equal(
    (html.match(/data-tariff=/g) || []).length,
    expectedPairs.length * 11
  );
  assert.doesNotMatch(html, /Комсомольск|__FONT_/);
  assert.match(html, /Все цены включают НДС/);
  assert.match(
    html,
    new RegExp(tariffs.loadingOvertimePrice.toLocaleString("ru-RU"))
  );
  for (const [code, city] of Object.entries(tariffs.places)) {
    assert.ok(html.includes(city));
    assert.ok(html.includes(tariffs.terminals[code]));
    const terminal = business.terminals[code];
    const phone = terminal.phones.find(
      (item) => item.id === terminal.contacts.general
    );
    assert.ok(html.includes(phone.text));
  }
  for (const text of Object.values(business.storage))
    assert.ok(html.includes(text));
  assert.doesNotMatch(html, /src="(?:https?:)?\/\//);
  assert.match(html, /data:image\/svg\+xml;base64,/);
  assert.equal((html.match(/data:font\/woff;base64,/g) || []).length, 2);
});

function renderNote(mixin, values = tariffs) {
  return pug.render("include pricing-notes.pug\n+" + mixin, {
    filename: fileURLToPath(
      new URL("../src/pug/note-test.pug", import.meta.url)
    ),
    tariffs: values
  });
}

function plainText(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;|\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

test("Price notes: full shared wording appears on the website and in the PDF", async () => {
  const pdf = plainText(await renderPriceHtml());
  const website = plainText(
    await readFile(new URL("../public/pricing.html", import.meta.url), "utf8")
  );
  for (const mixin of [
    "pricingCargoClassification()",
    "pricingOversizedNote()",
    "pricingLoadingNorm()",
    "pricingTruckDelivery('table')",
    "pricingExtraServices('table')"
  ]) {
    const text = plainText(renderNote(mixin));
    assert.ok(pdf.includes(text), "PDF: " + mixin);
    assert.ok(website.includes(text), "Website: " + mixin);
  }
  assert.match(pdf, /а также места, которые по своим размерам и свойствам/);
  assert.match(
    pdf,
    /Норматив погрузки\/выгрузки составляет 5 т \(25 м³\) в час/
  );
  assert.match(
    pdf,
    /дополнительная плата за простой машины под погрузкой\/выгрузкой/
  );
  assert.match(pdf, /Примечания/);
});

test("Price notes: changed tariffs flow into notes and the delivery table", () => {
  const changed = {
    ...tariffs,
    oversizedRaisingFactor: 1.6,
    loadingOvertimePrice: 7654,
    truckDeliveryPrices: [{title: "Тестовая подача", price: "1234 руб./час"}]
  };
  assert.match(plainText(renderNote("pricingOversizedNote()", changed)), /60%/);
  const norm = plainText(renderNote("pricingLoadingNorm()", changed));
  assert.match(norm, /7 654 руб\.\/час/);
  assert.doesNotMatch(norm, /5 000/);
  const delivery = plainText(
    renderNote("pricingTruckDelivery('table')", changed)
  );
  assert.match(delivery, /Тестовая подача 1234 руб\.\/час/);
  assert.doesNotMatch(delivery, /3000|4500|6000/);
});

test("Price PDF: reject extra pages and non-A4 paper", async () => {
  const twoPages = await PDFDocument.create();
  twoPages.addPage([842, 595]);
  twoPages.addPage([842, 595]);
  await assert.rejects(
    validatePricePdf(await twoPages.save()),
    /exactly one page/
  );
  const portrait = await PDFDocument.create();
  portrait.addPage([595, 842]);
  await assert.rejects(validatePricePdf(await portrait.save()), /A4 landscape/);
});

test("Price PDF: build provides a single-page PDF at the download URL, without a preview HTML", async () => {
  const website = await readFile(
    new URL("../public/pricing.html", import.meta.url),
    "utf8"
  );
  assert.match(website, /href="files\/price\/price\.pdf"/);
  assert.doesNotMatch(website, /price20260101prime_rev1\.pdf/);
  await validatePricePdf(
    await readFile(new URL("../public/files/price/price.pdf", import.meta.url))
  );
  const files = await readdir(
    new URL("../public/files/price/", import.meta.url)
  );
  assert.ok(
    !files.includes(previewFilename),
    "Do not publish the design preview"
  );
});

test("Price PDF: standalone generator produces a real single-page A4 PDF", async () => {
  const directory = await mkdtemp(join(tmpdir(), "berg-price-"));
  try {
    const pdfPath = await generatePricePdf(directory);
    const bytes = await readFile(pdfPath);
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
    await validatePricePdf(bytes);
    assert.ok(
      (await readFile(join(directory, previewFilename), "utf8")).includes(
        "Прайс-лист"
      )
    );
    await rm(join(directory, previewFilename));
    await generatePricePdf(directory, {writeHtml: false});
    assert.deepEqual(await readdir(directory), ["price.pdf"]);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
