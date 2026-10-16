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
