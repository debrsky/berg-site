import {readFileSync} from "node:fs";
import {test} from "node:test";
import {strict as assert} from "node:assert";
import gulp from "gulp";

const config = readFileSync(
  new URL("../src/.htaccess", import.meta.url),
  "utf8"
);
const archives = [
  "pricing20220201.html",
  "pricing20221001.html",
  "pricing20230911.html",
  "pricing-20240201.html",
  "pricing20240701.html"
];
const gone = [
  "truck-service.html",
  "containers.html",
  "schedule-2025-dec.html",
  "gradient-demo.html"
];

// Structural regression checks, not an Apache configuration interpreter.
test("SEO: exact archive and gone rules precede host redirects", () => {
  const rules = config
    .split(/\r?\n/)
    .filter((line) => line.startsWith("RewriteRule "));
  const expected = [
    ...archives.map(
      (name) =>
        `RewriteRule ^${name.replace(
          ".",
          "\\."
        )}$ https://bergvl.ru/pricing.html [R=301,L,QSD]`
    ),
    ...gone.map((name) => `RewriteRule ^${name.replace(".", "\\.")}$ - [G,L]`)
  ];
  assert.deepEqual(rules.slice(0, expected.length), expected);
  assert.equal(
    config.indexOf("RewriteCond %{HTTP_HOST}") >
      config.indexOf(expected[expected.length - 1]),
    true
  );
});

test("SEO: existing routing, AVIF, cache and document restrictions remain", () => {
  for (const directive of [
    "RewriteCond %{HTTP:X-Forwarded-Proto} !https",
    "RewriteRule ^$ https://%{HTTP_HOST}/home.html [R=301,L]",
    'RewriteRule "^contacts(/?)$" "https://bergvl.ru/contacts.html" [L,R=301]',
    'RewriteRule "^order(/?)$" "https://bergvl.ru/order.html" [L,R=301]',
    'RewriteRule "^docs(/?)$" "https://bergvl.ru/docs.html" [L,R=301]',
    "AddType image/avif                                  avif",
    'Header set Cache-Control "max-age=0, must-revalidate, proxy-revalidate"',
    '<Files "client-doc.html">\n    Header set X-Robots-Tag "noindex, nofollow"\n</Files>'
  ]) {
    assert.ok(config.includes(directive), directive);
  }
});

test("SEO: build copies root htaccess unchanged", () => {
  const built = readFileSync(
    new URL("../public/.htaccess", import.meta.url),
    "utf8"
  );
  assert.equal(built, config, "Run npm run build before these tests");
});

test("SEO: deployment glob includes root htaccess exactly once", async () => {
  const source = readFileSync(
    new URL("../gulp/deploy-z.js", import.meta.url),
    "utf8"
  );
  assert.ok(source.includes('["public/**/*", "public/.htaccess"]'));
  const paths = [];
  // Same globs as deploy; no server requests or archive upload.
  for await (const file of gulp.src(["public/**/*", "public/.htaccess"], {
    base: "public",
    encoding: false
  })) {
    if (file.isBuffer()) paths.push(file.relative);
  }
  assert.equal(paths.filter((path) => path === ".htaccess").length, 1);
});
