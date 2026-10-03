import {createSuggestions} from "@dadata/suggestions";
import {suggestionToken} from "../config";

export default function setSuggestions(form) {
  const suggestionElements = form.querySelectorAll("[data-suggestion-type]");
  suggestionElements.forEach((el) => {
    const type = {
      address: "address",
      name: "name",
      email: "email"
    }[el.dataset.suggestionType];

    if (!type) throw Error();

    createSuggestions(el, {
      token: suggestionToken,
      type,
      onSelect() {
        el.dispatchEvent(new Event("change", {bubbles: true}));
      }
    });
  });

  const setHandlers = (counterpartyRole) => {
    const counterpartyElement = form.elements[`${counterpartyRole}`];

    createSuggestions(counterpartyElement, {
      token: suggestionToken,
      type: "party",
      onSelect(suggestion) {
        const OGRNElement = form.elements[`${counterpartyRole}-OGRN`];
        const INNElement = form.elements[`${counterpartyRole}-INN`];
        const KPPElement = form.elements[`${counterpartyRole}-KPP`];
        const addressElement = form.elements[`${counterpartyRole}-address`];

        const address = suggestion.data.address?.value ?? "";

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
