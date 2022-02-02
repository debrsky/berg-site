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

export const saveForm = (form, options = {}) => {
  const data = formSerialize(form, options);
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

export const formSerialize = (form, options = {}) => {
  let exclude = [];
  if (typeof options.exclude === "string") exclude = [options.exclude];
  if (Array.isArray(options.exclude)) exclude = options.exclude;

  const formData = new FormData(form);

  // TODO CAVEAT it doesn't work with elements with multiple values
  return Object.fromEntries(
    [...formData.entries()].filter(
      ([key, value]) => value !== "" && !exclude.includes(key)
    )
  );
};

const makeElementsMap = (form) => {
  const namedElements = [...form.querySelectorAll("[name]")];
  return namedElements
    .map((el) => [el.getAttribute("name"), el])
    .reduce((acc, [key, value]) => {
      if (key in acc) {
        const prevValue = acc[key];
        if (Array.isArray(prevValue)) {
          prevValue.push(value);
          return acc;
        }

        acc[key] = [prevValue, value];
        return acc;
      }

      acc[key] = value;
      return acc;
    }, Object.create(null));
};

const deserializeElement = (element, key, value) => {
  if (element.getAttribute("name") !== key) throw Error();

  if (element.matches("input[type=radio], input[type=checkbox]")) {
    if (element.getAttribute("value") === value) {
      element.checked = true;
    }
    return;
  }

  element.value = value;
};

export const formDeserialize = (form, data) => {
  // CAVEAT it doesn't work with elements with multiple values

  const elementsMap = makeElementsMap(form);
  cleanForm(form);

  if (!data) return;

  Object.entries(data).forEach(([key, value]) => {
    // FIXME implement processing elements with multiple values
    if (Array.isArray(value)) throw Error();

    const element = elementsMap[key];
    if (!element) return;

    if (Array.isArray(element)) {
      element.forEach((el) => deserializeElement(el, key, value));
      return;
    }

    deserializeElement(element, key, value);
  });
};

// Сохранение данных формы при перезагрузке страницы
// https://blog.lisogorsky.ru/session-storage-save-data
// https://github.com/FThompson/FormPersistence.js
