import {parseRoute, supportedPair} from "./route.js";
import {normalizeQuantity} from "./calculator-transfer.js";

const options = ["ic-engine", "fridge", "oversized"];
const quantities = {weight: 1, volume: 3};

export function buildCalculatorShareUrl(href, tariffs, input) {
  if (!supportedPair(input.origin, input.destination, tariffs)) return null;
  const url = new URL(href);
  // Share only calculator inputs, not attribution or unrelated URL parameters.
  url.search = "";
  url.hash = "";
  url.searchParams.set("share", "1");
  url.searchParams.set("origin", input.origin);
  url.searchParams.set("destination", input.destination);
  let hasQuantity = false;
  for (const [name, scale] of Object.entries(quantities)) {
    if (input[name] === "") continue;
    const value = normalizeQuantity(input[name], scale);
    if (value === null) return null;
    url.searchParams.set(name, value);
    hasQuantity = true;
  }
  if (!hasQuantity) return null;
  for (const option of options) {
    if (input.params.includes(option))
      url.searchParams.append("params", option);
  }
  return url.href;
}

export function parseCalculatorShare(search, tariffs) {
  const query = new URLSearchParams(search);
  if (query.getAll("share").length !== 1 || query.get("share") !== "1")
    return null;
  const pair = parseRoute(search, tariffs);
  if (!pair) return null;
  const input = {
    ...pair,
    weight: "",
    volume: "",
    params: query.getAll("params")
  };
  if (
    input.params.some((option) => !options.includes(option)) ||
    new Set(input.params).size !== input.params.length
  )
    return null;
  for (const [name, scale] of Object.entries(quantities)) {
    const values = query.getAll(name);
    if (!values.length) continue;
    if (values.length !== 1) return null;
    const value = normalizeQuantity(values[0], scale);
    if (value === null) return null;
    input[name] = value;
  }
  return input.weight || input.volume ? input : null;
}

export function applyCalculatorShare(form, input) {
  if (!input) return;
  for (const name of ["origin", "destination", "weight", "volume"]) {
    form.elements[name].value = input[name].replace(".", ",");
  }
  for (const checkbox of form.querySelectorAll('[name="params[]"]')) {
    checkbox.checked = input.params.includes(checkbox.value);
  }
}

export function initCalculatorShare(form, win, getUrl) {
  const button = form.querySelector("[data-calculator-share]");
  const status = form.querySelector("[data-calculator-share-status]");
  const fallback = form.querySelector("[data-calculator-share-link]");
  button.hidden = false;
  button.addEventListener("click", async () => {
    const url = getUrl();
    status.textContent = "";
    fallback.hidden = true;
    if (!url) {
      status.textContent =
        "Выберите направление и укажите вес или объём груза.";
      return;
    }
    button.disabled = true;
    try {
      if (win.navigator.share) {
        try {
          await win.navigator.share({title: "Расчёт перевозки — ТК Берг", url});
          return;
        } catch (error) {
          if (error.name === "AbortError") return;
        }
      }
      await win.navigator.clipboard.writeText(url);
      status.textContent =
        "Ссылка на расчёт скопирована. Стоимость по ней рассчитывается по действующим тарифам.";
    } catch {
      fallback.hidden = false;
      fallback.value = url;
      fallback.focus();
      fallback.select();
      status.textContent =
        "Скопируйте ссылку вручную. Стоимость по ней рассчитывается по действующим тарифам.";
    } finally {
      button.disabled = false;
    }
  });
}
