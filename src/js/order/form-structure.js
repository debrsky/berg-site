export const setPayerVisibility = (form) => {
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

const setCounterpartyRoleStructure = (form, role) => {
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

export const setCounterpartyStructure = (form) => {
  setCounterpartyRoleStructure(form, "consigner");
  setCounterpartyRoleStructure(form, "consignee");
  setCounterpartyRoleStructure(form, "payer");
};

// Управление видимостью полей в разделах погрузки/выгрузки
const setCargoOperationStructure = (form, operation) => {
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

export const setCargoOperationsStructure = (form) => {
  setCargoOperationStructure(form, "loading");
  setCargoOperationStructure(form, "unloading");
};
