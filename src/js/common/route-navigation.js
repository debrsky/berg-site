import {routePages, routePositions, validContext, contextKey} from "./route.js";
import {readStorage, writeStorage} from "./storage.js";

// noopener tabs cannot inherit sessionStorage. Carry only a whitelisted source
// and the original click time, never full query/referrer or form contents.
export function prepareRouteNavigation(link, now = Date.now()) {
  const {routeId, routeGoal, ctaPosition} = link.dataset;
  if (
    link.target !== "_blank" ||
    !Object.hasOwnProperty.call(routePages, routeId) ||
    !routePositions.includes(ctaPosition) ||
    !["calculator", "order"].includes(routeGoal)
  )
    return;
  try {
    const url = new URL(link.href, window.location.href);
    if (
      url.origin !== window.location.origin ||
      url.pathname !== "/" + routeGoal + ".html"
    )
      return;
    url.searchParams.set("route_source", routeId);
    url.searchParams.set("route_time", String(now));
    link.href = url.href;
  } catch (_) {
    // An analytics helper must not block the original native link.
  }
}

export function parseNavigationContext(search, now = Date.now()) {
  const query = new URLSearchParams(search);
  if (
    query.getAll("route_source").length !== 1 ||
    query.getAll("route_time").length !== 1
  )
    return null;
  const routeId = query.get("route_source");
  const time = query.get("route_time");
  if (
    !Object.hasOwnProperty.call(routePages, routeId) ||
    !/^\d{1,16}$/.test(time)
  )
    return null;
  const context = {
    route_id: routeId,
    source_page: routePages[routeId],
    time: Number(time)
  };
  return validContext(context, now) ? context : null;
}

export function restoreRouteNavigation(search, now = Date.now()) {
  const incoming = parseNavigationContext(search, now);
  if (!incoming) return;
  const current = readStorage("sessionStorage", contextKey);
  if (validContext(current, now) && current.time > incoming.time) return;
  writeStorage("sessionStorage", contextKey, incoming);
}
