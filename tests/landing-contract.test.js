import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {routeLandings, routePages} from "../src/data/route-landings.js";
import {getLanding} from "../gulp/landing-data.js";
import {validContext} from "../src/js/common/route.js";
import {business, tariffs} from "./helpers/landing-data.js";
import {
  assertLandingLinks,
  normalizeLandingHtml
} from "./helpers/landing-contract.js";

const read = (file) =>
  readFileSync(new URL("../public/" + file, import.meta.url), "utf8");
const snapshots = JSON.parse(
  readFileSync(
    new URL("./fixtures/route-landings.sha256.json", import.meta.url),
    "utf8"
  )
);

test("Landing registry covers the independent pre-refactor page list", () => {
  assert.deepEqual(
    routeLandings.map((entry) => entry.slug).sort(),
    Object.keys(snapshots).sort()
  );
});

for (const entry of routeLandings) {
  const file = entry.slug + ".html";
  const html = read(file);

  test(`${entry.id}: shared links, anchors, route prefill and analytics contract`, () => {
    assertLandingLinks(html, entry, tariffs);
    assert.equal(routePages[entry.id], entry.slug);
    const time = Date.now();
    assert.ok(
      validContext({route_id: entry.id, source_page: entry.slug, time}, time)
    );
    assert.match(html, /<noscript>/);
    assert.match(html, /data-collapse-tariffs hidden/);
    assert.match(html, /route-landing__mobile-action"[^>]*hidden/);
    assert.ok(read("home.html").includes(`href="${file}"`));
    assert.ok(
      read("sitemap.xml").includes(`<loc>https://bergvl.ru/${file}</loc>`)
    );
    const landing = getLanding(entry.id, business, tariffs);
    const header = html.match(
      /<header class="landing-shell__header">([\s\S]*?)<\/header>/
    )[1];
    assert.ok(header.includes(`href="tel:${landing.sendingPhone.number}"`));
    assert.ok(html.includes(`href="tel:${landing.receivingPhone.number}"`));
    for (const asset of ["css/landing.css", "js/landing.js", "js/route.js"])
      assert.ok(html.includes(asset));
    assert.doesNotMatch(html, /js\/index.js|css\/style.css/);
  });

  test(`${entry.id}: HTML/text/SEO/SVG match the independent pre-refactor baseline`, () => {
    const hash = createHash("sha256")
      .update(normalizeLandingHtml(html))
      .digest("hex");
    assert.equal(
      hash,
      snapshots[entry.slug],
      "Review any intended content/markup change before updating the baseline"
    );
  });
}
