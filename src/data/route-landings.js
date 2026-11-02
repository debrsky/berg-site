// Landing identity/assets only: confirmed schedules and prices are separate data.
function defineLanding(origin, destination, slug, options = {}) {
  return {
    id: origin + "-" + destination,
    origin,
    destination,
    slug,
    hero: options.hero || "route-" + slug + ".svg",
    cargo: options.cargo ?? slug,
    related: options.related || []
  };
}

// Order preserves navigation on the home page. Related entries use stable pair IDs.
export const routeLandings = [
  defineLanding("vvo", "khb", "vladivostok-khabarovsk", {
    hero: "route-forklift.svg",
    cargo: "standard",
    related: ["khb-vvo"]
  }),
  defineLanding("khb", "vvo", "khabarovsk-vladivostok", {
    hero: "route-prepared-cargo.svg",
    cargo: "",
    related: ["vvo-khb"]
  }),
  defineLanding("vvo", "blg", "vladivostok-blagoveshchensk", {
    related: ["blg-vvo"]
  }),
  defineLanding("blg", "vvo", "blagoveshchensk-vladivostok", {
    related: ["vvo-blg"]
  }),
  defineLanding("uss", "khb", "ussuriysk-khabarovsk", {cargo: "ussuriysk"}),
  defineLanding("khb", "uss", "khabarovsk-ussuriysk", {related: ["uss-khb"]}),
  defineLanding("khb", "blg", "khabarovsk-blagoveshchensk"),
  defineLanding("blg", "khb", "blagoveshchensk-khabarovsk"),
  defineLanding("uss", "blg", "ussuriysk-blagoveshchensk", {
    related: ["blg-vvo"]
  })
];

export const routePages = Object.fromEntries(
  routeLandings.map(({id, slug}) => [id, slug])
);
