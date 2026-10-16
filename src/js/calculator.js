import {calculateCargo} from "./common/calculate.js";
import {supportedPair} from "./common/route.js";
import {buildOrderLink} from "./common/calculator-transfer.js";

const form = document.forms.calculator;
const tariffs = JSON.parse(
  document.getElementById("calculator-tariffs").textContent,
  (key, value) => (value === "Infinity" ? Infinity : value)
);
const maskOptions = {
  mask: Number,
  signed: false,
  thousandsSeparator: "",
  padFractionalZeros: false,
  normalizeZeros: true,
  radix: ",",
  mapToRadix: ["."]
};
const weightMask = new window.IMask(form.elements.weight, {
  ...maskOptions,
  scale: 1
});
const volumeMask = new window.IMask(form.elements.volume, {
  ...maskOptions,
  scale: 3
});
const positive = (number) => Number.isFinite(number) && number > 0;
const fmtQuantity = (number) =>
  number.toLocaleString("ru-RU", {maximumFractionDigits: 6});
const fmtMoney = (number) =>
  number.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

function readInput() {
  const data = new FormData(form);
  const weight = parseFloat(data.get("weight").replace(",", "."));
  const volume = parseFloat(data.get("volume").replace(",", "."));
  const weightOnly = positive(weight) && data.get("volume") === "";
  const volumeOnly = positive(volume) && data.get("weight") === "";
  return {
    weight: volumeOnly ? volume * 100 : weight,
    volume: weightOnly ? weight / 200 : volume,
    weightOnly,
    volumeOnly,
    origin: data.get("origin"),
    destination: data.get("destination"),
    params: data.getAll("params[]")
  };
}

function showAssumption(input, price) {
  const element = form.querySelector(".calculation-assumption");
  element.hidden = !price || (!input.weightOnly && !input.volumeOnly);
  if (element.hidden) return;
  element.textContent = input.weightOnly
    ? `При объёме не более ${fmtQuantity(
        input.volume
      )} м³. Укажите объём для точного расчёта.`
    : `При весе менее ${fmtQuantity(
        input.volume * 200
      )} кг. Укажите вес для точного расчёта.`;
}

function priceLabel(price) {
  if (price?.limit === Infinity) return "Машинорейс по договоренности";
  return price?.amount > 0 ? `${fmtMoney(price.amount)} ₽` : "<не рассчитано>";
}

function showPrice(input, price) {
  const category = form.querySelector(".cargo-category");
  // Tariff titles are trusted source data, never URL or form content.
  category.hidden = !price;
  category.innerHTML = price ? price.title : "";
  if (price?.isOversized) {
    category.append(document.createElement("br"), "негабаритный груз");
  }
  form.querySelector(".truck-trip").hidden = price?.limit !== Infinity;
  const preliminary =
    price?.amount > 0 && (input.weightOnly || input.volumeOnly);
  form.elements.result.value = preliminary
    ? `Предварительно: ${priceLabel(price)}`
    : priceLabel(price);
}

function updateCalculator() {
  const input = readInput();
  const {origin, destination} = input;
  const valid = supportedPair(origin, destination, tariffs);
  const orderLink = document.querySelector("[data-calculator-order]");
  // Read actual inputs, never the estimated weight/volume from readInput().
  orderLink.href = buildOrderLink(tariffs, {
    origin,
    destination,
    weight: form.elements.weight.value,
    volume: form.elements.volume.value
  });
  form.querySelector(".direction-error-message").hidden =
    !origin || !destination || valid;
  const price = valid ? calculateCargo(tariffs, input) : null;
  showAssumption(input, price);
  showPrice(input, price);
}

form.addEventListener("input", updateCalculator);
form.addEventListener("submit", (event) => event.preventDefault());
window.addEventListener("pageshow", () => {
  weightMask.updateValue();
  volumeMask.updateValue();
  updateCalculator();
});
