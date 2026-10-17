import {readFileSync, existsSync} from "node:fs";
import {test} from "node:test";
import {strict as assert} from "node:assert";

const html = readFileSync(
  new URL("../public/home.html", import.meta.url),
  "utf8"
);
const plain = (value) => value.replace(/<[^>]*>/g, "").trim();

test("Home: schedule keeps six confirmed routes with their own frequency", () => {
  const schedule = html.match(
    /<dl class="home-routes__schedule">([\s\S]*?)<\/dl>/
  )?.[1];
  assert.ok(schedule);
  const directions = [...schedule.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>/g)].map(
    (item) => plain(item[1])
  );
  const frequencies = [
    ...schedule.matchAll(/<dd\b[^>]*>([\s\S]*?)<\/dd>/g)
  ].map((item) => plain(item[1]));
  assert.deepEqual(directions, [
    "Владивосток — Хабаровск",
    "Хабаровск — Владивосток",
    "Владивосток — Благовещенск",
    "Благовещенск — Владивосток",
    "Владивосток — Комсомольск-на-Амуре",
    "Комсомольск-на-Амуре — Владивосток"
  ]);
  assert.deepEqual(frequencies, [
    "по рабочим дням",
    "по рабочим дням",
    "по вторникам и пятницам",
    "по вторникам и пятницам",
    "еженедельно",
    "еженедельно"
  ]);
  assert.equal((schedule.match(/<a\b/g) || []).length, 3);
  assert.doesNotMatch(schedule, /\shidden(?:[\s=>])|<button|<select/);
});

test("Home: route links lead to existing pages and unscheduled routes stay separate", () => {
  const block = html.match(
    /<div class="home-routes">([\s\S]*?)<\/section>/
  )?.[1];
  assert.ok(block);
  const links = [
    ...block.matchAll(
      /<a class="home-routes__link" href="([^"]+)">([^<]+)<\/a>/g
    )
  ];
  assert.equal(links.length, 10);
  assert.equal(new Set(links.map((item) => item[1])).size, 10);
  for (const [, href] of links) {
    assert.ok(existsSync(new URL(`../public/${href}`, import.meta.url)), href);
  }
  const other = block.slice(
    block.indexOf('<div class="home-routes__other">'),
    block.indexOf('<p class="home-routes__pricing">')
  );
  assert.equal((other.match(/<h4\b/g) || []).length, 4);
  assert.equal((other.match(/<a\b/g) || []).length, 6);
  assert.doesNotMatch(
    other,
    /home-routes__frequency|еженедельно|по рабочим дням/
  );
});
