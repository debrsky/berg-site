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

      const address = suggestion.data.address.data.postal_code
        ? `${suggestion.data.address.data.postal_code}, ${suggestion.data.address.value}`
        : suggestion.data.address.value;

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

form.addEventListener("change", handlePayerChange);
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

  operationPlaceElement.addEventListener("change", (event) => {
    const place = event.target.value;

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
  });

  operationPointElements.forEach((el) =>
    el.addEventListener("change", handleOperationPointChange)
  );
};

setCargoOperationHandlers("loading");
setCargoOperationHandlers("unloading");
// -- Прием и выдача груза

{
  // Составитель заявки
  const btnConsigner = form.querySelector(".order-author-consigner");
  const btnConsignee = form.querySelector(".order-author-consignee");
  const btnPayer = form.querySelector(".order-author-payer");

  const fioElement = form.elements["order-author-fio"];
  const telElement = form.elements["order-author-tel"];

  const handleAuthorHelperFactory = (role) => {
    const handleAuthorHelper = (event) => {
      const data = new FormData(form);

      let fio, tel;
      if (data.get(`${role}-type`) === `legal-entity`) {
        if (
          role === `payer` ||
          data.get(`${role}-is-payer`) === `consigner-is-payer`
        ) {
          fio = data.get(`${role}-paying-contact-fio`);
          tel = data.get(`${role}-paying-contact-tel`);
        } else {
          fio = data.get(`${role}-cargo-contact-fio`);
          tel = data.get(`${role}-cargo-contact-tel`);
        }
      } else if (data.get(`${role}-type`) === `private-person`) {
        fio = data.get(`${role}-fio`);
        tel = data.get(`${role}-tel`);
      }

      if (fio) {
        fioElement.value = fio;
        telElement.value = tel;
      }
    };

    return handleAuthorHelper;
  };

  btnConsigner.addEventListener(
    "click",
    handleAuthorHelperFactory(`consigner`)
  );
  btnConsignee.addEventListener(
    "click",
    handleAuthorHelperFactory(`consignee`)
  );
  btnPayer.addEventListener("click", handleAuthorHelperFactory(`payer`));
}
