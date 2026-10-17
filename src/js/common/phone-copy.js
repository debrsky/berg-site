// Progressive enhancement: native telephone links work without Clipboard API.
export function initPhoneCopy(root, win) {
  if (!win.isSecureContext || !win.navigator.clipboard?.writeText) return;
  root.querySelectorAll("[data-copy-phone]").forEach((button) => {
    const status = button.parentElement.querySelector('[role="status"]');
    if (!status) return;
    button.hidden = false;
    status.hidden = false;
    let timer;
    button.addEventListener("click", async () => {
      win.clearTimeout(timer);
      status.textContent = "";
      button.disabled = true;
      try {
        await win.navigator.clipboard.writeText(button.dataset.copyPhone);
        status.textContent = "Скопировано";
      } catch {
        status.textContent = "Не удалось скопировать. Выделите номер вручную.";
      } finally {
        button.disabled = false;
      }
      timer = win.setTimeout(() => {
        status.textContent = "";
      }, 4000);
    });
  });
}
