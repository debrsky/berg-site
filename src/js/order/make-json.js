export default (form) => {
  const data = new FormData(form);
  const order = Object.create(null);
  const places = window.places;

  const cargo = Object.create(null);
  Object.entries({
    name: "cargo",
    weight: "cargo-weight",
    volume: "cargo-volume",
    qty: "cargo-qty",
    condition: "cargo-condition",
    value: "cargo-value",
    insurance: "insurance"
  }).forEach(([key, value]) => {
    cargo[key] = data.get(value);
  });
  order.cargo = cargo;

  ["consigner", "consignee", "payer"].forEach((role) => {
    if (
      role === "payer" &&
      (Boolean(data.get("consigner-is-payer")) ||
        Boolean(data.get("consignee-is-payer")))
    )
      return;

    const counterAgent = Object.create(null);
    const counterAgentType = data.get(`${role}-type`);
    counterAgent.type = counterAgentType;
    if (counterAgentType === "legal-entity") {
      Object.entries({
        name: `${role}`,
        INN: `${role}-INN`,
        KPP: `${role}-KPP`,
        OGRN: `${role}-OGRN`,
        address: `${role}-address`,
        cargoContactTel: `${role}-cargo-contact-tel`,
        cargoContactFio: `${role}-cargo-contact-fio`,
        payingContactTel: `${role}-paying-contact-tel`,
        payingContactFio: `${role}-paying-contact-fio`
      }).forEach(([key, value]) => {
        if (
          role === "payer" &&
          (key === "cargoContactTel" || key === "cargoContactFio")
        )
          return;

        counterAgent[key] = data.get(value);
      });
    }
    if (counterAgentType === "private-person") {
      Object.entries({
        name: `${role}-fio`,
        tel: `${role}-tel`
      }).forEach(([key, value]) => {
        counterAgent[key] = data.get(value);
      });
    }

    if (["consigner", "consignee"].includes(role)) {
      counterAgent.isPayer = Boolean(data.get(`${role}-is-payer`));
    }

    if (role === "payer") {
      counterAgent.isPayer = true;
    }

    order[role] = counterAgent;
  });

  ["loading", "unloading"].forEach((operation) => {
    const operationObject = Object.create(null);
    Object.entries({
      date: `${operation}-date`,
      time: `${operation}-time`,
      place: `${operation}-place`,
      point: `${operation}-point`,
      pointClientAddress: `${operation}-point-client-address`
    }).forEach(([key, value]) => {
      if (key === "place") {
        operationObject[key] = places[data.get(value)] ?? "";
        return;
      }

      operationObject[key] = data.get(value);
    });
    order[operation] = operationObject;
  });

  order.paymentForm = data.get("payment-form");
  order.memo = data.get("memo");

  const author = Object.create(null);
  ["fio", "tel", "email"].forEach((key) => {
    author[key] = data.get(`order-author-${key}`);
  });
  order.author = author;

  return order;
};
