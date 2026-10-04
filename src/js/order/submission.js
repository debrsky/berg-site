const uncertainDeliveryMessage =
  "Не удалось получить подтверждение отправки. Заявка могла быть принята. Перед повторной отправкой уточните её статус у менеджера по телефону из шапки сайта.";

export function initOrderSubmission(
  form,
  {
    createBody,
    onSuccess,
    fetchRequest = fetch,
    timeoutMs = 30000,
    slowNoticeMs = 8000,
    minimumSendingMs = 1200
  }
) {
  const button = form.querySelector("button[type=submit]");
  const label = button.querySelector(".order-submit__label");
  const group = button.closest(".control-group");
  const status = group.querySelector(".order-submit__status");
  const errorMessage = group.querySelector(".control-group__error-message");
  let isSubmitting = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;
    const startedAt = performance.now();

    // aria-disabled сохраняет фокус; повторные submit блокирует флаг выше.
    button.setAttribute("aria-disabled", "true");
    button.setAttribute("aria-busy", "true");
    label.textContent = "Отправляем заявку…";
    group.classList.remove("control-group--error");
    errorMessage.textContent = "";
    status.textContent = "Пожалуйста, дождитесь подтверждения отправки.";

    const controller = new AbortController();
    let timedOut = false;
    let sent = false;
    let failureMessage =
      "Не удалось подготовить заявку к отправке. Данные сохранены в форме. Попробуйте ещё раз.";
    let timeout;
    let slowNotice;

    try {
      // Подготовка тоже может завершиться ошибкой, например при недоступном хранилище.
      const body = createBody();
      failureMessage = uncertainDeliveryMessage;
      timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);
      slowNotice = setTimeout(() => {
        status.textContent =
          "Сервер отвечает дольше обычного. Пожалуйста, подождите — заявка ещё отправляется.";
      }, slowNoticeMs);

      const response = await fetchRequest("php/mailer/send.php", {
        method: "POST",
        body,
        signal: controller.signal
      });
      if (!response.ok) throw Error("Unexpected response status");
      const data = await response.json();
      if (data.result !== "success") {
        if (data.result === "error") {
          failureMessage =
            "Почтовый сервер не смог отправить заявку. Данные сохранены в форме. Попробуйте ещё раз или свяжитесь с менеджером.";
        }
        throw Error("Unconfirmed delivery");
      }

      sent = true;
      // Доставка подтверждена: сетевые таймеры больше не нужны.
      clearTimeout(timeout);
      clearTimeout(slowNotice);

      // Быстрый ответ не должен превращать анимацию в короткую вспышку.
      // Время самого запроса входит в минимум, ошибки не задерживаем.
      const remainingMs = minimumSendingMs - (performance.now() - startedAt);
      if (remainingMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingMs));
      }

      label.textContent = "Заявка отправлена";
      status.textContent = "Заявка отправлена. Открываем подтверждение…";
    } catch (_) {
      if (timedOut) {
        failureMessage =
          "Время ожидания ответа истекло. Заявка могла быть принята. Перед повторной отправкой уточните её статус у менеджера по телефону из шапки сайта.";
      }
      status.textContent = "";
      group.classList.add("control-group--error");
      errorMessage.textContent = failureMessage;
      label.textContent = "Повторить отправку";
    } finally {
      clearTimeout(timeout);
      clearTimeout(slowNotice);
      button.setAttribute("aria-busy", "false");
      if (!sent) {
        button.setAttribute("aria-disabled", "false");
        isSubmitting = false;
      }
    }

    // После подтверждённой отправки остаёмся заблокированными до перехода.
    // Ошибку перехода или аналитики нельзя выдавать за ошибку доставки.
    if (sent) onSuccess();
  });
}
