const form = document.forms.order;

const suggestionToken = "1aef0cdf8ae200e131d3e69cb08ee4983f20e311";
const suggestionElements = form.querySelectorAll("[data-suggestion-type]");
suggestionElements.forEach((el) => {
  const type = {
    address: "ADDRESS",
    name: "NAME"
  }[el.dataset.suggestionType];

  if (!type) throw Error();

  $(el).suggestions({token: suggestionToken, type});
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

      if (suggestion.data.type === "INDIVIDUAL") {
        OGRNElement.value = suggestion.data.ogrn;
        INNElement.value = suggestion.data.inn;
        KPPElement.value = "";
        addressElement.value = suggestion.data.address.value;
      }

      if (suggestion.data.type === "LEGAL") {
        OGRNElement.value = suggestion.data.ogrn;
        INNElement.value = suggestion.data.inn;
        KPPElement.value = suggestion.data.kpp;
        addressElement.value = suggestion.data.address.value;
      }
    }
  });
};

setHandlers("consigner");
setHandlers("consignee");
setHandlers("payer");

// Спрятать/показать плательщика
const consignerIsPayer = form.elements["consigner-is-payer"];
const consigneeIsPayer = form.elements["consignee-is-payer"];
const payer = form.querySelector(".section-payer");

const handlePayerSelector = (event) => {
  if (event.target.checked) {
    if (event.target === consignerIsPayer) consigneeIsPayer.checked = false;
    if (event.target === consigneeIsPayer) consignerIsPayer.checked = false;
  }

  if (consignerIsPayer.checked || consigneeIsPayer.checked) {
    payer.hidden = true;
    return;
  }

  payer.hidden = false;
};

consignerIsPayer.addEventListener("change", handlePayerSelector);
consigneeIsPayer.addEventListener("change", handlePayerSelector);
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

  const operationPointTerminalTitleElement = form.querySelector(
    `.${operation}-point-terminal-title`
  );

  const operationPointTerminalControlElement = form.querySelector(
    `.${operation}-terminal-control`
  );

  const operationPointClientAddressGroupElement = form.querySelector(
    `.group-${operation}-point-client-address`
  );

  const operationPointClientAddressElement =
    form.elements[`${operation}-point-client-address`];

  const handleOperationPointChange = (event) => {
    const operationPointClientEnabled = operationPointClientElement.checked;
    operationPointClientAddressGroupElement.hidden = !operationPointClientEnabled;
  };

  operationPlaceElement.addEventListener("change", (event) => {
    const place = event.target.value;

    if (Object.keys(terminals).includes(place)) {
      operationPointTerminalTitleElement.textContent = `Терминал перевозчика: ${terminals[place]}`;
      operationPointTerminalControlElement.hidden = false;

      operationPointClientAddressElement.value = places[place];
    } else {
      operationPointTerminalTitleElement.textContent = `Терминал перевозчика`;
      operationPointTerminalControlElement.hidden = true;

      operationPointTerminalElement.checked = false;
      operationPointClientElement.checked = true;
      if (
        Object.values(places).includes(
          operationPointClientAddressElement.value.trim()
        )
      ) {
        operationPointClientAddressElement.value = "";
      }
      handleOperationPointChange();
    }
  });

  operationPointElements.forEach((el) =>
    el.addEventListener("change", handleOperationPointChange)
  );
};

setCargoOperationHandlers("loading");
setCargoOperationHandlers("unloading");

// -- Прием и выдача груза
