export default (form) => {
  const controlsRequired = form.querySelectorAll(".control--required");

  controlsRequired.forEach((el) => {
    const uiElement = el.querySelector("input, textarea, select");
    if (uiElement.matches("[hidden] *")) {
      uiElement.removeAttribute("required");
      return;
    }
    uiElement.setAttribute("required", "");
  });
};
