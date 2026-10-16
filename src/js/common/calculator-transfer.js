import {supportedPair, parseRoute, applyRoute} from "./route.js";

const cargoFields = [
  {param: "weight", field: "cargo-weight", scale: 1},
  {param: "volume", field: "cargo-volume", scale: 3}
];

// Match the calculator's input precision without rounding or estimating values.
export function normalizeQuantity(value, scale) {
  if (typeof value !== "string" || value.length > 32) return null;
  const pattern = new RegExp(`^\\d+(?:[.,]\\d{1,${scale}})?$`);
  if (!pattern.test(value)) return null;
  const [integer, fraction = ""] = value.replace(",", ".").split(".");
  const whole = integer.replace(/^0+(?=\d)/, "");
  const decimals = fraction.replace(/0+$/, "");
  const normalized = decimals ? `${whole}.${decimals}` : whole;
  const number = Number(normalized);
  return Number.isFinite(number) &&
    number > 0 &&
    number <= Number.MAX_SAFE_INTEGER
    ? normalized
    : null;
}

export function buildOrderLink(tariffs, input) {
  const {origin, destination} = input;
  if (!supportedPair(origin, destination, tariffs)) return "order.html";
  const query = new URLSearchParams({origin, destination});
  for (const {param, scale} of cargoFields) {
    const value = normalizeQuantity(input[param], scale);
    if (value !== null) query.set(param, value);
  }
  return `order.html?${query}`;
}

export function parseCargo(search) {
  const query = new URLSearchParams(search);
  const cargo = {};
  for (const {param, scale} of cargoFields) {
    const values = query.getAll(param);
    if (values.length === 0) continue;
    if (values.length !== 1) return null;
    const value = normalizeQuantity(values[0], scale);
    if (value === null) return null;
    cargo[param] = value;
  }
  return Object.keys(cargo).length ? cargo : null;
}

export function applyCargo(form, cargo) {
  if (!cargo) return "ignore";
  const fields = cargoFields.filter(({param}) => cargo[param] !== undefined);
  const conflict = fields.some(({param, field}) => {
    const current = form.elements[field].value;
    // Existing order inputs may contain extra trailing decimal zeroes.
    return current !== "" && normalizeQuantity(current, 32) !== cargo[param];
  });
  if (conflict) {
    const notice = form.querySelector("[data-route-notice]");
    notice.textContent =
      "В заявке сохранены другие вес или объём. Параметры груза из калькулятора не применены. Проверьте и при необходимости измените их вручную.";
    notice.hidden = false;
    return "conflict";
  }
  let applied = false;
  for (const {param, field} of fields) {
    if (form.elements[field].value !== "") continue;
    form.elements[field].value = cargo[param].replace(".", ",");
    applied = true;
  }
  if (applied) form.dispatchEvent(new Event("change"));
  return applied ? "apply" : "same";
}

export function applyOrderPrefill(form, search, tariffs) {
  const pair = parseRoute(search, tariffs);
  const cargo = parseCargo(search);
  const decision = applyRoute(form, pair, ["loading-place", "unloading-place"]);
  if (decision === "conflict" && cargo) {
    const notice = form.querySelector("[data-route-notice]");
    notice.textContent += " Вес и объём из калькулятора также не перенесены.";
  }
  if (decision !== "apply" && decision !== "same") return;
  applyCargo(form, cargo);
}
