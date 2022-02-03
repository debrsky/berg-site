export default (form) => {
  // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#the-constraint-validation-api
  // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#dom-cva-setcustomvalidity
  ["loading", "unloading"].forEach((operation) => {
    const addressElement = form.elements[`${operation}-point-client-address`];
    const placeElement = form.elements[`${operation}-place`];
    const placeView = placeElement.querySelector(
      `[value="${placeElement.value}"]`
    ).textContent;

    if (
      !addressElement.matches("[hidden] *") &&
      addressElement.value.replace(placeView, "").length <= 4
    ) {
      addressElement.setCustomValidity("Введите адрес.");
      return;
    }

    addressElement.setCustomValidity("");
  });
};
