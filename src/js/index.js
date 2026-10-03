import {setPlace} from "./common/set-place.js";

const themeToggle = document.getElementById("theme-toggle");

if (themeToggle) {
  const themeControl = themeToggle.closest(".theme-control");
  const themeLabel = themeToggle.querySelector(".theme-toggle__label");
  const systemTheme = window.matchMedia?.("(prefers-color-scheme: dark)");
  const modes = ["system", "light", "dark"];
  const modeNames = {light: "Светлая", dark: "Тёмная", system: "Как в системе"};

  let mode = "system";
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") mode = saved;
  } catch (_) {
    // При недоступном хранилище тема всё равно переключается в рамках страницы.
  }

  const render = () => {
    themeControl.dataset.mode = mode;
    themeLabel.textContent = `Тема: ${modeNames[mode]}`;
    document.documentElement.dataset.theme =
      mode === "system" ? (systemTheme?.matches ? "dark" : "light") : mode;
    const nextMode = modes[(modes.indexOf(mode) + 1) % modes.length];
    themeToggle.setAttribute(
      "aria-label",
      `Тема: ${modeNames[mode]}. Следующая тема: ${modeNames[nextMode]}`
    );
    themeToggle.title = `Следующая тема: ${modeNames[nextMode]}`;
  };

  themeToggle.disabled = false;
  render();

  themeToggle.addEventListener("click", () => {
    mode = modes[(modes.indexOf(mode) + 1) % modes.length];
    try {
      if (mode === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", mode);
    } catch (_) {
      // Выбранная тема остаётся активной до обновления страницы.
    }
    render();
  });

  systemTheme?.addEventListener?.("change", () => {
    if (mode === "system") render();
  });
}

(async () => {
  const userPlace = (await setPlace()) ?? "Владивосток";
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
  const placeDependentElements =
    contactsElement.querySelectorAll("[data-place]");
  placeDependentElements.forEach((element) => {
    element.hidden = element.dataset.place !== place;
  });
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
