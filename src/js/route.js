import {parseRoute, applyRoute, trackRouteClick} from "./common/route.js";
import {applyOrderPrefill} from "./common/calculator-transfer.js";
import {
  prepareRouteNavigation,
  restoreRouteNavigation
} from "./common/route-navigation.js";

const handleRouteActivation = (event) => {
  if (event.type === "auxclick" && event.button !== 1) return;
  const link = event.target.closest("a[data-route-goal]");
  if (!link || event.defaultPrevented) return;
  prepareRouteNavigation(link);
  trackRouteClick(link);
};
document.addEventListener("click", handleRouteActivation);
document.addEventListener("auxclick", handleRouteActivation);

document.addEventListener("DOMContentLoaded", () => {
  const data = document.getElementById("route-tariffs");
  if (!data) return;
  const tariffs = JSON.parse(data.textContent);
  const form = document.forms.order || document.forms.calculator;
  if (!form) return;
  restoreRouteNavigation(window.location.search);
  if (form.name === "order") {
    applyOrderPrefill(form, window.location.search, tariffs);
  } else {
    applyRoute(form, parseRoute(window.location.search, tariffs), [
      "origin",
      "destination"
    ]);
  }
  form.addEventListener("change", () => {
    const notice = form.querySelector("[data-route-notice]");
    if (notice) notice.hidden = true;
  });
});
