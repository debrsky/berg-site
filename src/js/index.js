import {setPlace} from "./common/set-place.js";

import "./common/theme.js";
import {consentEvent, hasAdditionalConsent} from "./common/privacy-consent.js";

const select = document.getElementById("contacts__place-selector");

function renderCity(place) {
  select.value = place;
  document.body.dataset.city = select.selectedOptions[0]?.dataset.city || "vvo";
  select.style.width = `${place.length}ch`;

  const contactsElement = document.getElementById("contacts");
  const placeDependentElements =
    contactsElement.querySelectorAll("[data-place]");
  placeDependentElements.forEach((element) => {
    element.hidden = element.dataset.place !== place;
  });
}

async function detectCity() {
  const place = (await setPlace()) ?? "Владивосток";
  // Do not replace a city manually chosen while geolocation was loading.
  let manualCity;
  try {
    manualCity = localStorage.getItem("userPlace");
  } catch (_) {
    // Storage is optional.
  }
  renderCity(manualCity || place);
}

select.addEventListener("change", (event) => {
  const place = event.target.value;
  try {
    localStorage.setItem("userPlace", place);
  } catch (_) {
    // The choice still works for the current page.
  }
  renderCity(place);
});

detectCity();
window.addEventListener(consentEvent, () => {
  if (hasAdditionalConsent()) detectCity();
});

function addDevNotification() {
  const hostname = window.location.hostname;

  if (hostname.startsWith("dev.")) {
    // Создаём элемент уведомления
    const notification = document.createElement("div");
    notification.textContent =
      "Это сайт в режиме разработки (dev)! Не для продакшена.";

    // Стили для видимости: красный баннер сверху
    notification.style.position = "fixed";
    notification.style.top = "0";
    notification.style.left = "0";
    notification.style.width = "100%";
    notification.style.backgroundColor = "red";
    notification.style.color = "white";
    notification.style.padding = "10px";
    notification.style.textAlign = "center";
    notification.style.fontWeight = "bold";
    notification.style.opacity = ".7";
    notification.style.zIndex = "9999"; // Чтобы был поверх всего

    // Вставляем в начало body
    document.body.insertBefore(notification, document.body.firstChild);
  }
}

// Вызов функции после загрузки страницы
window.addEventListener("load", addDevNotification);
