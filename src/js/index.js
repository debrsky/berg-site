import {setPlace} from "./common/set-place.js";

(async () => {
  const userPlace = await setPlace();
  select.value = userPlace;
  select.dispatchEvent(new Event("change", {bubbles: true}));
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

function addDevNotification() {
  const hostname = window.location.hostname;

  if (hostname.startsWith('dev.')) {
    // Создаём элемент уведомления
    const notification = document.createElement('div');
    notification.textContent = 'Это сайт в режиме разработки (dev)! Не для продакшена.';

    // Стили для видимости: красный баннер сверху
    notification.style.position = 'fixed';
    notification.style.top = '0';
    notification.style.left = '0';
    notification.style.width = '100%';
    notification.style.backgroundColor = 'red';
    notification.style.color = 'white';
    notification.style.padding = '10px';
    notification.style.textAlign = 'center';
    notification.style.fontWeight = 'bold';
    notification.style.opacity = '.7';
    notification.style.zIndex = '9999'; // Чтобы был поверх всего

    // Вставляем в начало body
    document.body.insertBefore(notification, document.body.firstChild);
  }
}

// Вызов функции после загрузки страницы
window.addEventListener('load', addDevNotification);
