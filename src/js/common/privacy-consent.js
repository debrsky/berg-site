export const consentKey = "berg-privacy-consent";
export const consentVersion = "2026-10-24.1";
export const consentLifetime = 180 * 24 * 60 * 60 * 1000;
export const consentEvent = "berg:privacy-change";

export function validConsent(value, now = Date.now()) {
  return Boolean(
    value &&
      value.version === consentVersion &&
      typeof value.allowed === "boolean" &&
      Number.isFinite(value.timestamp) &&
      value.timestamp <= now &&
      now - value.timestamp < consentLifetime
  );
}

export function getConsent(browser = window, now = Date.now()) {
  try {
    const value =
      browser.bergPrivacyChoice ??
      JSON.parse(browser.localStorage.getItem(consentKey));
    return validConsent(value, now) ? value : null;
  } catch (_) {
    return null;
  }
}

export function hasAdditionalConsent(browser = window) {
  return getConsent(browser)?.allowed === true;
}

export function saveConsent(allowed, browser = window, now = Date.now()) {
  const value = {version: consentVersion, allowed, timestamp: now};
  browser.bergPrivacyChoice = value;
  try {
    browser.localStorage.setItem(consentKey, JSON.stringify(value));
  } catch (_) {
    // The choice still applies to this page if storage is unavailable.
  }
  return value;
}

export function clearAnalyticsStorage(browser = window, page = document) {
  for (const kind of ["localStorage", "sessionStorage"]) {
    try {
      const storage = browser[kind];
      Object.keys(storage)
        .filter((key) => key.startsWith("_ym"))
        .forEach((key) => storage.removeItem(key));
    } catch (_) {
      // Storage may be blocked by the browser.
    }
  }
  const domains = browser.location.hostname.split(".");
  const paths = browser.location.pathname.split("/");
  const cookiePaths = ["/"];
  paths.pop();
  while (paths.length > 1) {
    cookiePaths.push(paths.join("/") + "/");
    paths.pop();
  }
  for (const item of page.cookie.split(";")) {
    const name = item.trim().split("=")[0];
    if (!name.startsWith("_ym")) continue;
    for (const path of cookiePaths) {
      const expired = name + "=; Max-Age=0; path=" + path + ";";
      page.cookie = expired;
      for (let i = 0; i < domains.length - 1; i++) {
        const domain = domains.slice(i).join(".");
        page.cookie = expired + " domain=" + domain + ";";
        page.cookie = expired + " domain=." + domain + ";";
      }
    }
  }
}
