import {readFileSync} from "node:fs";
import {test} from "node:test";
import {strict as assert} from "node:assert";

const html = readFileSync(
  new URL("../public/weight-control.html", import.meta.url),
  "utf8"
);
const normalize = (text) => text.replace(/\s+/g, " ").trim();

// Inspect actual HTML independently of map rendering and third-party availability.
test("Weight control: all map points have visible static locations and equipment", () => {
  const data = JSON.parse(
    html.match(/const data = (\{[\s\S]*?\})\s*ymaps\.ready/)?.[1]
  );
  const staticHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  const section = staticHtml.match(
    /<section id="checkpoints">([\s\S]*?)<\/section>/
  )?.[1];
  assert.ok(section, "The list must not depend on scripts or map loading");
  assert.match(
    section,
    /<h2\b[^>]*>Список пунктов весогабаритного контроля<\/h2>/
  );
  assert.doesNotMatch(section, /\bhidden\b|display:\s*none|<details\b/);
  const items = [...section.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(([, item]) =>
    normalize(item.replace(/<[^>]+>/g, " "))
  );
  assert.equal(data.features.length, 11);
  assert.equal(items.length, 11);
  data.features.forEach(({properties}, index) => {
    assert.ok(items[index].includes(normalize(properties.balloonContentBody)));
    assert.ok(items[index].includes(properties.clusterCaption));
    assert.ok(
      items[index].includes(
        normalize(
          properties.balloonContentFooter.replace(properties.clusterCaption, "")
        )
      )
    );
  });
  assert.match(staticHtml, /href="#checkpoints"/);
  assert.match(staticHtml, /<div id="map"/);
});
