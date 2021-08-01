import {suggestionToken} from "../config";

export default function setSuggestions(form) {
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
}