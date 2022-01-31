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
};

form.addEventListener("change", handleFormChange);

let isSubmiting = false;
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isSubmiting) return;
  isSubmiting = true;

  const buttonSubmit = form.querySelector("button[type=submit]");
  buttonSubmit.classList.add("button--submiting");

  saveForm(form);

  const json = makeOrderJSON(form);

  const dataToSend = new FormData();
  dataToSend.append("data", JSON.stringify(json));

  const errorGroupElement = form
    .querySelector("button[type=submit]")
    .closest(".control-group");
  errorGroupElement.classList.remove("control-group--error");

  // TODO timeout for fetch
  fetch("php/mailer/send.php", {
    method: "POST",
    body: dataToSend
  })
    .then(function (res) {
      if (!res.ok)
        throw Error(
          "При отправке заявки возникла ошибка, заявка не отправлена."
        );
      return res.json();
    })
    .then(function (data) {
      console.log(data);
      if (data.result !== "success")
        throw Error(
          "При отправке заявки возникла ошибка почтового сервера, заявка не отправлена."
        );

      cleanForm(form);
      window.location.assign("order-ok.html");
    })
    .catch((err) => {
      console.error(err.message);
      errorGroupElement.classList.add("control-group--error");
    })
    .finally(() => {
      buttonSubmit.classList.remove("button--submiting");
      isSubmiting = false;
    });

  // const content = dialog.$el.querySelector(".dialog-content__data");
  // window.dialog.show();
});

const cleanFormElement = form.querySelector(".suggest-helper--clean-form");
cleanFormElement.addEventListener("click", () => {
  cleanForm(form);
});

const fillFormElement = form.querySelector(".suggest-helper--fill-form");
fillFormElement.addEventListener("click", () => {
  restoreSavedForm(form);
  const acceptElement = form.elements.accept;
  acceptElement.checked = false;
});
