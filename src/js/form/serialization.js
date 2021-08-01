export const cleanForm = (form) => {
  const namedElements = form.querySelectorAll("[name]");
  namedElements.forEach((element) => {
    if (element.matches("input[type=radio], input[type=checkbox]")) {
      element.checked = false;
      return;
    }

    element.value = "";
  });
};

// Сериализация
export const formSerialize = (form) => {
  const formData = new FormData(form);

  //CAVEAT it doesn't work with elements with multiple values
  const data = Object.fromEntries(
    [...formData.entries()].filter(([key, value]) => value !== "")
  );

  return data;
};

export const formDeserialize = (form, data) => {
  //CAVEAT it doesn't work with elements with multiple values

  const namedElements = [...form.querySelectorAll("[name]")];

  const elementsMap = namedElements
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

  cleanForm(form);

  if (!data) return;

  Object.entries(data).forEach(([key, value]) => {
    //FIXME implement processing elements with multiple values
    if (Array.isArray(value)) throw Error();

    const element = elementsMap[key];
    if (!element) return;

    const processElement = (element, key, value) => {
      if (element.getAttribute("name") !== key) throw Error();

      if (element.matches("input[type=radio], input[type=checkbox]")) {
        if (element.getAttribute("value") === value) {
          element.checked = true;
        }
        return;
      }

      element.value = value;
    };

    if (Array.isArray(element)) {
      element.forEach((el) => processElement(el, key, value));
      return;
    }

    processElement(element, key, value);
  });
};

// Сохранение данных формы при перезагрузке страницы
// https://blog.lisogorsky.ru/session-storage-save-data
// https://github.com/FThompson/FormPersistence.js
