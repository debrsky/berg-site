import {
  cleanForm,
  formSerialize,
  formDeserialize
} from "./form/serialization.js";
import setSuggestions from "./order/suggestion";
import makeOrderJSON from "./order/make-json";

const form = document.forms.order;

setSuggestions(form);

const setPayerVisibility = () => {
  const data = new FormData(form);

  ["consigner", "consignee"].forEach((role) => {
    const rolePayingContactElement = form.querySelector(
      `.${role}-paying-contact`
    );

    const roleType = data.get(`${role}-type`);
    const roleIsPayer = data.get(`${role}-is-payer`) === `${role}-is-payer`;
    const rolePayingContactEnabled = roleIsPayer && roleType == "legal-entity";
    rolePayingContactElement.hidden = !rolePayingContactEnabled;
  });

  const consignerIsPayer =
    data.get("consigner-is-payer") === "consigner-is-payer";
  const consigneeIsPayer =
    data.get("consignee-is-payer") === "consignee-is-payer";

  const payerElement = form.querySelector(".section-payer");
  payerElement.hidden = consignerIsPayer || consigneeIsPayer;
};

const handlePayerSelectorClick = (event) => {
  if (!event) return;

  const consignerIsPayerElement = form.elements["consigner-is-payer"];
  const consigneeIsPayerElement = form.elements["consignee-is-payer"];

  if (
    event.target === consignerIsPayerElement &&
    consignerIsPayerElement.checked
  ) {
    consigneeIsPayerElement.checked = false;
  }
  if (
    event.target === consigneeIsPayerElement &&
    consigneeIsPayerElement.checked
  ) {
    consignerIsPayerElement.checked = false;
  }
};

const setRequiredAttributes = (event) => {
  const controlsRequired = form.querySelectorAll(".control--required");

  controlsRequired.forEach((el) => {
    const uiElement = el.querySelector("input, textarea, select");
    if (uiElement.matches("[hidden] *")) {
      uiElement.removeAttribute("required");
      return;
    }
    uiElement.setAttribute("required", "");
  });
};

// Управление видимостью полей в разделах погрузки/выгрузки
const setCargoOperationStructure = (operation) => {
  const data = new FormData(form);

  const operationPlace = data.get(`${operation}-place`);
  const operationPoint = data.get(`${operation}-point`);

  const operationPointTerminalControlElement = form.querySelector(
    `.${operation}-terminal-control`
  );
  const operationPointClientControlElement = form.querySelector(
    `.${operation}-client-control`
  );
  const operationPointPickupControlElement = form.querySelector(
    `.${operation}-pickup-control`
  );

  const operationPointTerminalTitleElement = form.querySelector(
    `.${operation}-point-terminal-title`
  );

  const operationPointClientAddressGroupElement = form.querySelector(
    `.group-${operation}-point-client-address`
  );

  operationPointClientAddressGroupElement.hidden =
    !operationPoint || operationPoint === `${operation}-point-terminal`;

  if (!operationPlace) {
    // Не выбран город
    operationPointTerminalControlElement.hidden = false;
    operationPointClientControlElement.hidden = false;
    operationPointPickupControlElement.hidden = false;
  } else if (Object.keys(terminals).includes(operationPlace)) {
    // Выбран город из списка
    operationPointTerminalControlElement.hidden = false;
    operationPointClientControlElement.hidden = false;
    operationPointPickupControlElement.hidden = true;

    operationPointTerminalTitleElement.textContent = `Терминал перевозчика: ${terminals[operationPlace]}`;
  } else {
    // Выбран другой город
    operationPointTerminalControlElement.hidden = true;
    operationPointClientControlElement.hidden = true;
    operationPointPickupControlElement.hidden = false;
  }
};

const setCounterpartyRoleStructure = (role) => {
  const data = new FormData(form);

  const legalEntityGroupElement = form.querySelector(
    `.group-${role}-legal-entity`
  );
  const privatePersonGroupElement = form.querySelector(
    `.group-${role}-private-person`
  );

  const type = data.get(`${role}-type`);

  legalEntityGroupElement.hidden = type !== "legal-entity";
  privatePersonGroupElement.hidden = type !== "private-person";
};

const handleFormChange = (event) => {
  setCounterpartyRoleStructure("consigner");
  setCounterpartyRoleStructure("consignee");
  setCounterpartyRoleStructure("payer");

  handlePayerSelectorClick(event);
  setPayerVisibility(event);

  setCargoOperationStructure("loading");
  setCargoOperationStructure("unloading");

  setRequiredAttributes(event);

  // form persistance
  const data = formSerialize(form);
  sessionStorage.setItem("order", JSON.stringify(data));
};

form.addEventListener("change", handleFormChange);

const setOperationPlaceChangeHandlers = (operation) => {
  const placeElement = form.elements[`${operation}-place`];
  const addressElement = form.elements[`${operation}-point-client-address`];

  placeElement.addEventListener("change", () => {
    addressElement.value = places[placeElement.value] ?? "";
  });
};
setOperationPlaceChangeHandlers("loading");
setOperationPlaceChangeHandlers("unloading");

form.addEventListener("submit", (event) => {
  const form = event.currentTarget;
  event.preventDefault();

  const data = formSerialize(form);
  localStorage.setItem("order", JSON.stringify(data));

  const content = dialog.$el.querySelector(".dialog-content__data");
  const json = makeOrderJSON(form);

  dialog.show();

  // const href = location.href;
  const url = new URL("./order-print.html", location.href);
  url.searchParams.append("data", JSON.stringify(json));
  window.open(url);
});

document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(sessionStorage.getItem("order"));
  formDeserialize(form, data);
  handleFormChange();
});

const cleanFormElement = form.querySelector(".suggest-helper--clean-form");
cleanFormElement.addEventListener("click", () => {
  cleanForm(form);
  handleFormChange();
});

const fillForm = (form) => {
  const savedForm = localStorage.getItem("order");
  if (savedForm) {
    const data = JSON.parse(savedForm);
    formDeserialize(form, data);
  }

  handleFormChange();
};

const fillFormElement = form.querySelector(".suggest-helper--fill-form");
fillFormElement.addEventListener("click", () => fillForm(form));
