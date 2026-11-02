import {test} from "node:test";
import {strict as assert} from "node:assert";
import {existsSync, readFileSync, readdirSync} from "node:fs";
import {business, tariffs} from "./helpers/landing-data.js";
import {routeLandings} from "../src/data/route-landings.js";
import {
  parseRoute,
  supportedPair,
  validContext
} from "../src/js/common/route.js";
import {buildOrderLink} from "../src/js/common/calculator-transfer.js";
import {parseCalculatorShare} from "../src/js/common/calculator-share.js";

const directory = new URL("../public/", import.meta.url);
const read = (file) => readFileSync(new URL(file, directory), "utf8");
const closed = [
  ["vvo", "kms", "vladivostok-komsomolsk-na-amure"],
  ["uss", "kms", "ussuriysk-komsomolsk-na-amure"],
  ["khb", "kms", "khabarovsk-komsomolsk-na-amure"],
  ["blg", "kms", "blagoveshchensk-komsomolsk-na-amure"],
  ["kms", "vvo", "komsomolsk-na-amure-vladivostok"],
  ["kms", "khb", "komsomolsk-na-amure-khabarovsk"]
];

test("Closed direction: no city, terminal, schedule or price remains in shared data", () => {
  assert.deepEqual(Object.keys(tariffs.places), ["vvo", "uss", "khb", "blg"]);
  assert.doesNotMatch(
    JSON.stringify({tariffs, business, routeLandings}),
    /kms|Комсомольск|79244114161/
  );
});

test("Closed direction: old URLs cannot prefill, share or attribute a supported shipment", () => {
  for (const [origin, destination, slug] of closed) {
    const query = `?origin=${origin}&destination=${destination}&weight=500&volume=1`;
    assert.equal(supportedPair(origin, destination, tariffs), false);
    assert.equal(parseRoute(query, tariffs), null);
    assert.equal(parseCalculatorShare(query + "&share=1", tariffs), null);
    assert.equal(
      buildOrderLink(tariffs, {origin, destination, weight: "500"}),
      "order.html"
    );
    const time = Date.now();
    assert.equal(
      validContext(
        {route_id: `${origin}-${destination}`, source_page: slug, time},
        time
      ),
      false
    );
  }
});

test("Closed direction: generated pages and sitemap contain no closed offers or contacts", () => {
  for (const file of readdirSync(directory).filter(
    (name) => name.endsWith(".html") || name === "sitemap.xml"
  )) {
    assert.doesNotMatch(
      read(file),
      /Комсомольск|komsomolsk|\bkms\b|79244114161|Северное шоссе/,
      file
    );
  }
  const config = read(".htaccess");
  for (const [, , slug] of closed) {
    assert.equal(existsSync(new URL(slug + ".html", directory)), false);
    assert.ok(config.includes(`RewriteRule ^${slug}\\.html$ - [G,L]`));
  }
});
