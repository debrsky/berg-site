import {readFileSync} from "node:fs";
import {test} from "node:test";
import {strict as assert} from "node:assert";
import postcss from "postcss";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const html = read("../public/home.html");
const styles = postcss.parse(read("../public/css/style.css"));
const swiper = postcss.parse(read("../public/css/swiper.css"));

function declarations(root, selector) {
  const values = {};
  root.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    rule.walkDecls((decl) => {
      values[decl.prop] = decl.value;
    });
  });
  return values;
}

function luminance(hex) {
  const rgb = hex.replace("#", "");
  const expanded = rgb.length === 3 ? [...rgb].map((c) => c + c).join("") : rgb;
  const linear = expanded.match(/../g).map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

test("Home: terminal city selector has an associated label", () => {
  assert.match(
    html,
    /<label[^>]*for="contacts__place-selector"[^>]*>Город терминала<\/label>/
  );
  assert.match(html, /<select[^>]*id="contacts__place-selector"/);
});

test("Primary button: normal, hover and focus backgrounds meet white text AA contrast", () => {
  const variables = declarations(styles, "html");
  for (const selector of [
    ".button--primary",
    ".button--primary:hover:not(:disabled)",
    ".button--primary:focus"
  ]) {
    const button = declarations(styles, selector);
    assert.equal(button.color, "var(--brand-color-white)");
    const name = button["background-color"].match(/^var\((--[\w-]+)\)$/)?.[1];
    assert.ok(name, selector);
    const contrast = 1.05 / (luminance(variables[name]) + 0.05);
    assert.ok(contrast >= 4.5, `${selector}: ${contrast.toFixed(2)}:1`);
  }
});

test("Home: slider touch targets are 44px, wrap and retain a keyboard focus indicator", () => {
  const bullet = declarations(
    swiper,
    ".swiper-pagination .swiper-pagination-bullet"
  );
  assert.equal(bullet.width, "44px");
  assert.equal(bullet.height, "44px");
  assert.equal(declarations(swiper, ".swiper-pagination")["flex-wrap"], "wrap");
  assert.equal(
    declarations(
      swiper,
      ".swiper-pagination.swiper-pagination-bullets .swiper-pagination-bullet"
    ).margin,
    "0"
  );
  assert.ok(
    declarations(swiper, ".swiper-pagination-bullet:focus-visible::before")
      .outline
  );
});
