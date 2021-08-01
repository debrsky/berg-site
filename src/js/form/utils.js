import {formSerialize, formDeserialize} from "./serialization";

export const cleanForm = (form) => {
  const namedElements = form.querySelectorAll("[name]");
  namedElements.forEach((element) => {
    if (element.matches("input[type=radio], input[type=checkbox]")) {
      element.checked = false;
      return;
    }

    element.value = "";
  });
  form.dispatchEvent(new Event("change"));
};

export const saveForm = (form) => {
  const data = formSerialize(form);
  const formName = form.getAttribute("name");
  localStorage.setItem(`form[name=${formName}]`, JSON.stringify(data));
};

export const restoreSavedForm = (form) => {
  const formName = form.getAttribute("name");
  const savedForm = localStorage.getItem(`form[name=${formName}]`);
  if (savedForm) {
    const data = JSON.parse(savedForm);
    formDeserialize(form, data);
  }

  form.dispatchEvent(new Event("change"));
};
