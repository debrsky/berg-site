import {cleanForm, saveForm, restoreSavedForm} from "./form/utils";
import setSuggestions from "./order/suggestion";
import makeOrderJSON from "./order/make-json";
import setRequiredAttributes from "./order/required";
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

const handlePayerSelectorChange = (event) => {
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
  handlePayerSelectorChange(event);
  setCounterpartyStructure(form);
  setPayerVisibility(form);
  setCargoOperationsStructure(form);
  setRequiredAttributes(form);
};

form.addEventListener("change", handleFormChange);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  saveForm(form);

  const json = makeOrderJSON(form);

  // const content = dialog.$el.querySelector(".dialog-content__data");
  const dialog = document.getlElementById("sent-dialog");
  dialog.show();

  // const href = location.href;
  const url = new URL("./order-print.html", location.href);
  url.searchParams.append("data", JSON.stringify(json));
  window.open(url);
});

const cleanFormElement = form.querySelector(".suggest-helper--clean-form");
cleanFormElement.addEventListener("click", () => {
  cleanForm(form);
});

const fillFormElement = form.querySelector(".suggest-helper--fill-form");
fillFormElement.addEventListener("click", () => restoreSavedForm(form));
