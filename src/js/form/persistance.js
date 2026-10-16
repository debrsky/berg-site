import {formSerialize, formDeserialize} from "./utils.js";
import {readStorage, writeStorage} from "../common/storage.js";
const eventListeners = [];

export const enablePersistance = (form) => {
  const formName = form.getAttribute("name");
  const eventListenersObject = eventListeners.find((el) => el.form === form);
  if (eventListenersObject) throw Error(`Persistance already enabled for form`);

  const handleFormChange = () => {
    const data = formSerialize(form);
    writeStorage("sessionStorage", `form[name=${formName}]`, data);
  };
  const handleDOMContentLoaded = () => {
    const data = readStorage("sessionStorage", `form[name=${formName}]`);
    formDeserialize(form, data);

    form.dispatchEvent(new Event("change"));
  };

  eventListeners.push({form, handleFormChange, handleDOMContentLoaded});

  form.addEventListener("change", handleFormChange);
  document.addEventListener("DOMContentLoaded", handleDOMContentLoaded);
};

export const disablePersistance = (form) => {
  const eventListenersObject = eventListeners.find((el) => el.form === form);
  if (!eventListenersObject)
    throw Error(`Persistance already disabled for form`);

  form.removeEventListener("change", eventListenersObject.handleFormChange);
  document.removeEventListener(
    "DOMContentLoaded",
    eventListenersObject.handleDOMContentLoaded
  );
};
