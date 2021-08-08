import {setPlace} from "./common/set-place.js";

(async () => {
  const userPlace = await setPlace();
  select.value = userPlace;
  select.dispatchEvent(new Event("change"));
})();

const select = document.getElementById("contacts__place-selector");

select.addEventListener("change", (event) => {
  const target = event.target;
  const place = target.value;
  localStorage.setItem("userPlace", place);

  target.style.width = `${place.length}ch`;

  const contactsElement = document.getElementById("contacts");
  const placeDependentElements = contactsElement.querySelectorAll(
    "[data-place]"
  );
  placeDependentElements.forEach((element) => {
    element.hidden = element.dataset.place !== place;
  });
});
