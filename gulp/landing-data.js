import {readFileSync, statSync} from "node:fs";
import {routeLandings} from "../src/data/route-landings.js";

const kinds = ["documents", "parcel", "pallet", "volume"];

export function validateLandingRegistry(entries) {
  const ids = new Set();
  const slugs = new Set();
  for (const entry of entries) {
    if (
      entry.id !== entry.origin + "-" + entry.destination ||
      entry.origin === entry.destination ||
      !/^[a-z]+-[a-z]+$/.test(entry.id)
    )
      throw new Error("Invalid landing pair: " + entry.id);
    if (!/^[a-z]+(?:-[a-z]+)*$/.test(entry.slug))
      throw new Error("Invalid landing slug: " + entry.slug);
    if (ids.has(entry.id) || slugs.has(entry.slug))
      throw new Error("Duplicate landing: " + entry.id);
    ids.add(entry.id);
    slugs.add(entry.slug);
  }
  for (const entry of entries) {
    for (const id of entry.related) {
      if (!ids.has(id)) throw new Error("Unknown related landing: " + id);
    }
  }
}

function readSvg(path) {
  // Only repository-owned paths from the registry may reach unescaped SVG output.
  if (!/^[a-z0-9/.-]+$/.test(path) || path.includes(".."))
    throw new Error("Invalid landing artwork path: " + path);
  const svg = readFileSync(
    new URL("../src/img/" + path, import.meta.url),
    "utf8"
  ).trim();
  validateLandingSvg(svg, path);
  return svg;
}

export function validateLandingSvg(svg, label = "SVG") {
  if (
    !/^<svg(?:\s|\/?>)/.test(svg) ||
    /<(?:script|image|foreignObject)\b|\son[a-z]+\s*=|\b(?:href|xlink:href)\s*=/i.test(
      svg
    )
  )
    throw new Error("Unsafe landing artwork: " + label);
}

export function loadLandingAssets(entries = routeLandings) {
  validateLandingRegistry(entries);
  return Object.fromEntries(
    entries.map((entry) => {
      const cargo = Object.fromEntries(
        kinds.map((kind) => [
          kind,
          readSvg(
            "cargo-examples/" +
              (entry.cargo ? entry.cargo + "/" : "") +
              kind +
              ".svg"
          )
        ])
      );
      return [entry.id, {hero: readSvg(entry.hero), cargo}];
    })
  );
}

function contact(business, code, purpose) {
  const terminal = business.terminals[code];
  const id = terminal?.contacts?.[purpose];
  const phones = id ? terminal.phones.filter((item) => item.id === id) : [];
  if (phones.length > 1)
    throw new Error("Duplicate " + purpose + " contact for " + code);
  const phone = phones[0];
  if (!phone?.number || !phone.text)
    throw new Error("Missing " + purpose + " contact for " + code);
  return phone;
}

export function getLanding(id, business, tariffs, entries = routeLandings) {
  const entry = entries.find((item) => item.id === id);
  if (
    !entry ||
    tariffs.heavyCargoPrices[0].price?.[entry.origin]?.[entry.destination] ==
      null
  )
    throw new Error("Unknown or unpriced landing: " + id);
  const related = entry.related.map((relatedId) => {
    const page = entries.find((item) => item.id === relatedId);
    if (!page) throw new Error("Unknown related landing: " + relatedId);
    return {...page, pagePath: page.slug + ".html"};
  });
  return {
    ...entry,
    related,
    pagePath: entry.slug + ".html",
    sendingPhone: contact(business, entry.origin, "sending"),
    receivingPhone: contact(business, entry.destination, "receiving"),
    generalPhone: contact(business, entry.origin, "general"),
    schedule: business.routes.find(
      (item) =>
        item.origin === entry.origin && item.destination === entry.destination
    )
  };
}

async function freshData(path) {
  const url = new URL(path, import.meta.url);
  // Reload edited data in gulp watch, without retaining SVG strings in ESM modules.
  url.searchParams.set("mtime", String(statSync(url).mtimeMs));
  return import(url.href);
}

export async function landingLocals() {
  const [{routeLandings: entries}, {landingCopy}] = await Promise.all([
    freshData("../src/data/route-landings.js"),
    freshData("../src/data/landing-copy.js")
  ]);
  const assets = loadLandingAssets(entries);
  return {
    routeLandings: entries,
    landingCopy,
    landingPath: (id) => {
      const entry = entries.find((item) => item.id === id);
      if (!entry) throw new Error("Unknown landing link: " + id);
      return entry.slug + ".html";
    },
    getLanding: (id, business, tariffs) =>
      getLanding(id, business, tariffs, entries),
    landingHero: (id) => assets[id].hero,
    landingCargo: (id, kind) => assets[id].cargo[kind]
  };
}
