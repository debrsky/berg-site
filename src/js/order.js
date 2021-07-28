//TODO Сохранять данные формы при перезагрузке страницы
// https://blog.lisogorsky.ru/session-storage-save-data
// https://github.com/FThompson/FormPersistence.js

const form = document.forms.order;

const suggestionToken = "1aef0cdf8ae200e131d3e69cb08ee4983f20e311";
const suggestionElements = form.querySelectorAll("[data-suggestion-type]");
suggestionElements.forEach((el) => {
  const type = {
    address: "ADDRESS",
    name: "NAME",
    email: "EMAIL"
  }[el.dataset.suggestionType];

  if (!type) throw Error();

  $(el).suggestions({token: suggestionToken, type});
  //TODO адрес без области и района https://codepen.io/dadata/pen/qdwPdZ
});

const setHandlers = (counterpartyRole) => {
  const handleTypeChange = (event) => {
    const legalEntityGroupElement = form.querySelector(
      `.group-${counterpartyRole}-legal-entity`
    );
    const privatePersonGroupElement = form.querySelector(
      `.group-${counterpartyRole}-private-person`
    );

    const formData = new FormData(form);
    const type = formData.get(`${counterpartyRole}-type`);

    legalEntityGroupElement.hidden = true;
    privatePersonGroupElement.hidden = true;

    if (type === "legal-entity") legalEntityGroupElement.hidden = false;
    if (type === "private-person") privatePersonGroupElement.hidden = false;
  };

  const counterPartyTypeElements = form.elements[`${counterpartyRole}-type`];
  [...counterPartyTypeElements].forEach((el) =>
    el.addEventListener("change", handleTypeChange)
  );

  const counterpartyElement = form.elements[`${counterpartyRole}`];

  $(counterpartyElement).suggestions({
    token: suggestionToken,
    type: "PARTY",
    onSelect: function (suggestion) {
      const OGRNElement = form.elements[`${counterpartyRole}-OGRN`];
      const INNElement = form.elements[`${counterpartyRole}-INN`];
      const KPPElement = form.elements[`${counterpartyRole}-KPP`];
      const addressElement = form.elements[`${counterpartyRole}-address`];

      console.log(suggestion);

      const address = suggestion.data.address.value;

      if (suggestion.data.type === "INDIVIDUAL") {
        OGRNElement.value = suggestion.data.ogrn;
        INNElement.value = suggestion.data.inn;
        KPPElement.value = "";
        addressElement.value = address;
      }

      if (suggestion.data.type === "LEGAL") {
        OGRNElement.value = suggestion.data.ogrn;
        INNElement.value = suggestion.data.inn;
        KPPElement.value = suggestion.data.kpp;
        addressElement.value = address;
      }
    }
  });
};

setHandlers("consigner");
setHandlers("consignee");
setHandlers("payer");

// Спрятать/показать плательщика
const consignerIsPayerElement = form.elements["consigner-is-payer"];
const consigneeIsPayerElement = form.elements["consignee-is-payer"];
const payerElement = form.querySelector(".section-payer");
const consignerPayingContactElement = form.querySelector(
  ".consigner-paying-contact"
);
const consigneePayingContactElement = form.querySelector(
  ".consignee-paying-contact"
);

const handlePayerChange = (event) => {
  const data = new FormData(form);

  const consignerType = data.get("consigner-type");
  const consignerIsPayer =
    data.get("consigner-is-payer") === "consigner-is-payer";
  const consignerPayingContactEnabled =
    consignerIsPayer && consignerType == "legal-entity";
  consignerPayingContactElement.hidden = !consignerPayingContactEnabled;

  const consigneeType = data.get("consignee-type");
  const consigneeIsPayer =
    data.get("consignee-is-payer") === "consignee-is-payer";
  const consigneePayingContactEnabled =
    consigneeIsPayer && consigneeType == "legal-entity";
  consigneePayingContactElement.hidden = !consigneePayingContactEnabled;

  payerElement.hidden = consignerIsPayer || consigneeIsPayer;
};

const handlePayerSelectorClick = (event) => {
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
  const controlsToSetAttr = form.querySelectorAll(".control--required");
  const elementsToRemoveAttr = form.querySelectorAll("[hidden] [required]");

  controlsToSetAttr.forEach((el) => {
    const uiElement = el.querySelector("input, textarea, select");
    uiElement.setAttribute("required", "");
  });

  elementsToRemoveAttr.forEach((el) => {
    el.removeAttribute("required");
  });
};

form.addEventListener("change", handlePayerChange);
//FIXME form.addEventListener("change", setRequiredAttributes);

consignerIsPayerElement.addEventListener("change", handlePayerSelectorClick);
consigneeIsPayerElement.addEventListener("change", handlePayerSelectorClick);

// -- Спрятать/показать плательщика

// Прием и выдача груза
const setCargoOperationHandlers = (operation) => {
  const operationPlaceElement = form.elements[`${operation}-place`];

  const operationPointElements = form.elements[`${operation}-point`];
  const operationPointTerminalElement = [...operationPointElements].find(
    (el) => el.getAttribute("value") === `${operation}-point-terminal`
  );
  const operationPointClientElement = [...operationPointElements].find(
    (el) => el.getAttribute("value") === `${operation}-point-client`
  );
  const operationPointPickupElement = [...operationPointElements].find(
    (el) => el.getAttribute("value") === `${operation}-point-pickup`
  );

  const operationPointTerminalTitleElement = form.querySelector(
    `.${operation}-point-terminal-title`
  );

  const operationPointTerminalControlElement = form.querySelector(
    `.${operation}-terminal-control`
  );
  const operationPointClientControlElement = form.querySelector(
    `.${operation}-client-control`
  );
  const operationPointPickupControlElement = form.querySelector(
    `.${operation}-pickup-control`
  );

  const operationPointClientAddressGroupElement = form.querySelector(
    `.group-${operation}-point-client-address`
  );

  const operationPointClientAddressElement =
    form.elements[`${operation}-point-client-address`];

  const handleOperationPointChange = (event) => {
    const operationPointClientAddressGroupEnebled =
      operationPointClientElement.checked ||
      operationPointPickupElement.checked;

    operationPointClientAddressGroupElement.hidden = !operationPointClientAddressGroupEnebled;
  };

  const handleOperationPlaceElementChange = () => {
    const place = operationPlaceElement.value;

    if (Object.keys(terminals).includes(place)) {
      // Выбран город из списка
      operationPointTerminalTitleElement.textContent = `Терминал перевозчика: ${terminals[place]}`;
      operationPointTerminalControlElement.hidden = false;
      operationPointClientControlElement.hidden = false;
      operationPointPickupControlElement.hidden = true;

      operationPointClientAddressElement.value = `${places[place]} `;
    } else {
      // Выбран другой город
      operationPointTerminalTitleElement.textContent = `Терминал перевозчика`;
      operationPointTerminalControlElement.hidden = true;
      operationPointClientControlElement.hidden = true;
      operationPointPickupControlElement.hidden = false;

      operationPointTerminalElement.checked = false;
      operationPointClientElement.checked = false;
      operationPointPickupElement.checked = true;
      if (
        Object.values(places).includes(
          operationPointClientAddressElement.value.trim()
        )
      ) {
        operationPointClientAddressElement.value = "";
      }
      handleOperationPointChange();
    }
  };

  operationPlaceElement.addEventListener(
    "change",
    handleOperationPlaceElementChange
  );

  operationPointElements.forEach((el) =>
    el.addEventListener("change", handleOperationPointChange)
  );
};

setCargoOperationHandlers("loading");
setCargoOperationHandlers("unloading");
// -- Прием и выдача груза

// Сериализация
const formSerialize = (form) => {
  const formData = new FormData(form);

  //CAVEAT it doesn't work with elements with multiple values
  const data = Object.fromEntries(
    [...formData.entries()].filter(([key, value]) => value !== "")
  );

  return data;
};

const formDeserialize = (form, data) => {
  //CAVEAT it doesn't work with elements with multiple values

  const namedElemens = [...form.querySelectorAll("[name]")];

  const elementsMap = namedElemens
    .map((el) => [el.getAttribute("name"), el])
    .reduce((acc, [key, value]) => {
      if (key in acc) {
        const prevValue = acc[key];
        if (Array.isArray(prevValue)) {
          prevValue.push(value);
          return acc;
        }

        acc[key] = [prevValue, value];
        return acc;
      }

      acc[key] = value;
      return acc;
    }, Object.create(null));

  // console.log(elementsMap);

  // Clean form
  namedElemens.forEach((element) => {
    if (element.matches("input[type=radio], input[type=checkbox]")) {
      element.checked = false;
      return;
    }

    element.value = "";
  });

  if (!data) return;

  Object.entries(data).forEach(([key, value]) => {
    //FIXME implement processing elements with multiple values
    if (Array.isArray(value)) throw Error();

    const element = elementsMap[key];
    if (!element) return;

    const processElement = (element, key, value) => {
      if (element.getAttribute("name") !== key) throw Error();

      if (element.matches("input[type=radio], input[type=checkbox]")) {
        if (element.getAttribute("value") === value) {
          element.checked = true;
        }
        return;
      }

      element.value = value;
    };

    if (Array.isArray(element)) {
      element.forEach((el) => processElement(el, key, value));
      return;
    }

    processElement(element, key, value);
  });
};

form.addEventListener("submit", (event) => {
  const form = event.currentTarget;
  event.preventDefault();

  const data = formSerialize(form);

  sessionStorage.setItem("order", JSON.stringify(data));

  // formDeserialize(form, data);
  // alert("Заявка отправлена.");
});

document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(sessionStorage.getItem("order"));
  console.log(data);
  formDeserialize(form, data);
});
