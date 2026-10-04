import {cleanForm, saveForm, restoreSavedForm} from "./form/utils";
import setSuggestions from "./order/suggestion";
import makeOrderJSON from "./order/make-json";
import setRequiredAttributes from "./order/required";
import setCustomValidity from "./order/custom-validity";
import {initOrderSubmission} from "./order/submission.js";

import {
  setPayerVisibility,
  setCounterpartyStructure,
  setCargoOperationsStructure
} from "./order/form-structure";
import {enablePersistance} from "./form/persistance.js";

const form = document.forms.order;
enablePersistance(form);
setSuggestions(form);

const consignerIsPayerElement = form.elements["consigner-is-payer"];
const consigneeIsPayerElement = form.elements["consignee-is-payer"];

const handleIsPayerCheckboxChange = (event) => {
  if (!event) return;

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

const handleFormChange = (event) => {
  handleIsPayerCheckboxChange(event);

  setCounterpartyStructure(form);
  setPayerVisibility(form);
  setCargoOperationsStructure(form);
  setRequiredAttributes(form);
  setCustomValidity(form);
};

form.addEventListener("change", handleFormChange);

initOrderSubmission(form, {
  createBody: () => {
    saveForm(form, {exclude: ["loading-date", "accept"]});
    const dataToSend = new FormData();
    dataToSend.append("data", JSON.stringify(makeOrderJSON(form)));
    return dataToSend;
  },
  onSuccess: () => {
    cleanForm(form);
    try {
      window.orderSuccessfullySent?.();
    } catch (error) {
      console.warn(
        "Не удалось зарегистрировать отправку заявки в аналитике",
        error
      );
    }
    window.location.assign("order-ok.html");
  }
});

const cleanFormElement = form.querySelector(".suggest-helper--clean-form");
cleanFormElement.addEventListener("click", () => {
  cleanForm(form);
});

const fillFormElement = form.querySelector(".suggest-helper--fill-form");
fillFormElement.addEventListener("click", () => {
  restoreSavedForm(form);
});
