import {readStorage, writeStorage} from "./storage.js";

export const routePages = {
  "vvo-khb": "vladivostok-khabarovsk",
  "khb-vvo": "khabarovsk-vladivostok",
  "vvo-blg": "vladivostok-blagoveshchensk"
};
export const contextKey = "route-source";
export const contextTTL = 30 * 60 * 1000;
export const routePositions = ["hero", "tariff", "terminal", "bottom"];

export function supportedPair(origin, destination, tariffs) {
  return Boolean(
    origin !== destination &&
      Object.hasOwnProperty.call(tariffs.places, origin) &&
      Object.hasOwnProperty.call(tariffs.places, destination) &&
      tariffs.heavyCargoPrices[0].price?.[origin]?.[destination] != null
  );
}

export function parseRoute(search, tariffs) {
  const query = new URLSearchParams(search);
  if (
    query.getAll("origin").length !== 1 ||
    query.getAll("destination").length !== 1
  )
    return null;
  const origin = query.get("origin");
  const destination = query.get("destination");
  return supportedPair(origin, destination, tariffs)
    ? {origin, destination}
    : null;
}

export function prefillDecision(pair, origin, destination) {
  if (!pair) return "ignore";
  if (!origin && !destination) return "apply";
  return origin === pair.origin && destination === pair.destination
    ? "same"
    : "conflict";
}

export function validContext(context, now = Date.now()) {
  return Boolean(
    context &&
      Object.hasOwnProperty.call(routePages, context.route_id) &&
      routePages[context.route_id] === context.source_page &&
      Number.isFinite(context.time) &&
      context.time <= now &&
      now - context.time < contextTTL
  );
}

export function reachGoal(name, params) {
  try {
    window.ym?.(87156585, "reachGoal", name, params);
  } catch (_) {
    // Analytics must never interrupt navigation or a confirmed submission.
  }
}

export function rememberRoute(routeId, now = Date.now()) {
  if (!Object.hasOwnProperty.call(routePages, routeId)) return;
  writeStorage("sessionStorage", contextKey, {
    route_id: routeId,
    source_page: routePages[routeId],
    time: now
  });
}

export function trackRouteClick(element) {
  const {routeId, ctaPosition, routeGoal} = element.dataset;
  if (
    !Object.hasOwnProperty.call(routePages, routeId) ||
    !routePositions.includes(ctaPosition)
  )
    return;
  if (!["calculator", "order", "phone"].includes(routeGoal)) return;
  if (routeGoal !== "phone") rememberRoute(routeId);
  reachGoal("route_" + routeGoal + "_click", {
    route_id: routeId,
    cta_position: ctaPosition
  });
}

export function trackRouteSuccess() {
  const context = readStorage("sessionStorage", contextKey);
  // Consume before sending; reload/back cannot repeat this success.
  writeStorage("sessionStorage", contextKey, null);
  if (!validContext(context)) return;
  reachGoal("route_order_success", {
    route_id: context.route_id,
    source_page: context.source_page
  });
}

export function applyRoute(form, pair, names) {
  const origin = form.elements[names[0]];
  const destination = form.elements[names[1]];
  const decision = prefillDecision(pair, origin.value, destination.value);
  if (decision === "apply") {
    origin.value = pair.origin;
    destination.value = pair.destination;
    form.dispatchEvent(new Event(names[0] === "origin" ? "input" : "change"));
  }
  const notice = form.querySelector("[data-route-notice]");
  if (notice) {
    notice.hidden = decision !== "conflict";
    if (decision === "conflict") {
      notice.textContent =
        "В форме сохранены другие города. Маршрут по ссылке не применён. Проверьте города отправления и получения и при необходимости измените их вручную.";
    }
  }
  return decision;
}
