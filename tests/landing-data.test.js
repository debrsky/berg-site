import {test} from "node:test";
import {strict as assert} from "node:assert";
import {routeLandings} from "../src/data/route-landings.js";
import {
  getLanding,
  loadLandingAssets,
  landingLocals,
  validateLandingRegistry,
  validateLandingSvg
} from "../gulp/landing-data.js";
import {business, tariffs} from "./helpers/landing-data.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

// Independent phone expectations protect against errors in the shared data itself.
const expected = {
  vvo: {sending: "+79243304405", receiving: "+79243304409"},
  uss: {sending: "+79243307799", receiving: "+79243307799"},
  khb: {sending: "+79243302076", receiving: "+79842953632"},
  blg: {sending: "+79248411208", receiving: "+79248411208"},
  kms: {sending: "+79244114161", receiving: "+79244114161"}
};

test("Landing data: registry covers exactly the fifteen priced directed pairs", () => {
  validateLandingRegistry(routeLandings);
  const pairs = Object.entries(tariffs.heavyCargoPrices[0].price).flatMap(
    ([origin, destinations]) =>
      Object.keys(destinations).map((destination) => origin + "-" + destination)
  );
  assert.deepEqual(routeLandings.map((entry) => entry.id).sort(), pairs.sort());
  for (const entry of routeLandings) {
    const context = getLanding(entry.id, business, tariffs);
    assert.equal(context.sendingPhone.number, expected[entry.origin].sending);
    assert.equal(
      context.receivingPhone.number,
      expected[entry.destination].receiving
    );
  }
});

test("Landing data: duplicate identities, invalid pairs and broken related references fail", () => {
  const first = routeLandings[0];
  assert.throws(
    () => validateLandingRegistry([...routeLandings, first]),
    /Duplicate landing/
  );
  assert.throws(
    () =>
      validateLandingRegistry([{...first, id: "vvo-vvo", destination: "vvo"}]),
    /Invalid landing pair/
  );
  assert.throws(
    () => validateLandingRegistry([{...first, slug: "../bad", related: []}]),
    /Invalid landing slug/
  );
  assert.throws(
    () => validateLandingRegistry([{...first, related: ["missing-route"]}]),
    /Unknown related landing/
  );
});

test("Landing data: contact selection survives role edits and phone reordering", () => {
  const edited = clone(business);
  for (const terminal of Object.values(edited.terminals)) {
    terminal.phones.reverse();
    terminal.phones.forEach((phone) => {
      phone.role = "Changed editorial wording";
    });
  }
  for (const entry of routeLandings) {
    const context = getLanding(entry.id, edited, tariffs);
    assert.equal(context.sendingPhone.number, expected[entry.origin].sending);
    assert.equal(
      context.receivingPhone.number,
      expected[entry.destination].receiving
    );
  }
});

test("Landing data: unknown/unpriced pairs and missing contacts fail without fallback", () => {
  assert.throws(
    () => getLanding("uss-vvo", business, tariffs),
    /Unknown or unpriced/
  );
  const edited = clone(business);
  edited.terminals.vvo.phones = edited.terminals.vvo.phones.filter(
    (phone) => phone.id !== "sending"
  );
  assert.throws(
    () => getLanding("vvo-khb", edited, tariffs),
    /Missing sending contact/
  );
  const duplicated = clone(business);
  duplicated.terminals.vvo.phones.push({
    ...duplicated.terminals.vvo.phones.find((phone) => phone.id === "sending")
  });
  assert.throws(
    () => getLanding("vvo-khb", duplicated, tariffs),
    /Duplicate sending contact/
  );
  const prices = {heavyCargoPrices: [{price: {}}]};
  assert.throws(
    () => getLanding("vvo-khb", business, prices),
    /Unknown or unpriced/
  );
});

test("Landing data: optional schedule never inherits dates or durations from another pair", () => {
  assert.equal(
    getLanding("vvo-kms", business, tariffs).schedule.schedule,
    "еженедельно"
  );
  assert.equal(
    getLanding("vvo-kms", business, tariffs).schedule.days,
    undefined
  );
  assert.equal(getLanding("uss-kms", business, tariffs).schedule, undefined);
  assert.equal(getLanding("vvo-khb", business, tariffs).schedule.days, 3);
});

test("Landing data: operational time labels and full rules use the same values", () => {
  assert.equal(business.receptionCutoff, "11:00");
  assert.equal(business.applicationCutoff, "16:00");
  assert.ok(business.reception.includes(business.receptionCutoff));
  assert.ok(business.applicationDeadline.includes(business.applicationCutoff));
});

test("Landing data: all SVG assets are validated and included inline, traversal fails", async () => {
  const assets = loadLandingAssets();
  const locals = await landingLocals();
  assert.equal(Object.keys(assets).length, 15);
  for (const entry of routeLandings) {
    assert.match(assets[entry.id].hero, /^<svg/);
    assert.equal(Object.keys(assets[entry.id].cargo).length, 4);
    assert.equal(locals.landingHero(entry.id), assets[entry.id].hero);
    for (const kind of Object.keys(assets[entry.id].cargo)) {
      assert.equal(
        locals.landingCargo(entry.id, kind),
        assets[entry.id].cargo[kind]
      );
    }
  }
  const invalid = routeLandings.map((entry, index) =>
    index === 0 ? {...entry, hero: "../outside.svg"} : entry
  );
  assert.throws(
    () => loadLandingAssets(invalid),
    /Invalid landing artwork path/
  );
});

test("Landing data: unescaped SVG rejects executable markup and external references", () => {
  validateLandingSvg('<svg><path d="M0 0h1"/></svg>');
  for (const svg of [
    "<svg><script>alert(1)</script></svg>",
    '<svg onload = "alert(1)"></svg>',
    '<svg><image href = "https://example.com/a.png"/></svg>',
    "<svg><foreignObject><div>HTML</div></foreignObject></svg>",
    '<svg><use xlink:href = "#external"/></svg>',
    "<svg-invalid></svg-invalid>"
  ]) {
    assert.throws(() => validateLandingSvg(svg), /Unsafe landing artwork/);
  }
});
