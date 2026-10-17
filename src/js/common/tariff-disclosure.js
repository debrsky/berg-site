// The native summary remains the only control when JavaScript is unavailable.
export function initTariffDisclosure(root) {
  root.querySelectorAll("[data-collapse-tariffs]").forEach((button) => {
    const disclosure = button.closest("details");
    const summary = disclosure?.querySelector("summary");
    if (!summary) return;
    button.hidden = false;
    button.addEventListener("click", () => {
      disclosure.open = false;
      summary.focus({preventScroll: true});
      summary.scrollIntoView({block: "start", behavior: "auto"});
    });
  });
}
