import {strict as assert} from "node:assert";
import {existsSync} from "node:fs";
import {parseRoute} from "../../src/js/common/route.js";

const directory = new URL("../../public/", import.meta.url);

function checkLink(attrs, entry, tariffs, html) {
  const href = attrs.match(/href="([^"]+)"/)[1].replaceAll("&amp;", "&");
  if (/^(#|tel:)/.test(href) || href === entry.slug + ".html") {
    assert.doesNotMatch(attrs, /target=/);
  } else {
    assert.match(attrs, /target="_blank" rel="noopener"/);
    assert.match(attrs, /title="Откроется в новой вкладке"/);
  }
  if (href.startsWith("#")) {
    assert.ok(html.includes(`id="${href.slice(1)}"`), href);
  } else if (!/^(https?:|tel:)/.test(href)) {
    assert.ok(existsSync(new URL(href.split(/[?#]/)[0], directory)), href);
  }
  if (!attrs.includes("data-route-goal=")) return;
  assert.ok(attrs.includes(`data-route-id="${entry.id}"`));
  assert.match(
    attrs,
    /data-cta-position="(hero|tariff|terminal|bottom|mobile)"/
  );
  if (!href.startsWith("tel:")) {
    assert.deepEqual(
      parseRoute(new URL(href, "https://bergvl.ru/").search, tariffs),
      {origin: entry.origin, destination: entry.destination}
    );
  }
}

export function assertLandingLinks(html, entry, tariffs) {
  for (const [, attrs] of html.matchAll(/<a\b([^>]+)>/g)) {
    checkLink(attrs, entry, tariffs, html);
  }
}

export function normalizeLandingHtml(html) {
  // SVG formatting/comments may differ; text, attributes, geometry and structure may not.
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .trim();
}
