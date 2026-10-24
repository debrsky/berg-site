import {
  consentKey,
  consentEvent,
  getConsent,
  hasAdditionalConsent,
  saveConsent,
  clearAnalyticsStorage
} from "./common/privacy-consent.js";

const banner = document.querySelector("[data-privacy-banner]");
let servicesStarted = false;
let opener;

function appendScript(url, onload) {
  const script = document.createElement("script");
  script.async = true;
  script.src = url;
  if (onload) script.onload = onload;
  document.head.append(script);
}

function startBrowserUpdater() {
  if (!document.body.classList.contains("page")) return;
  appendScript("https://yastatic.net/browser-updater/v1/script.js", () => {
    if (!hasAdditionalConsent()) return;
    // eslint-disable-next-line new-cap
    window.bergBrowserUpdater = new window.ya.browserUpdater.init({
      lang: "ru",
      browsers: {
        yabrowser: "16.12",
        chrome: "62",
        ie: "11",
        opera: "35",
        safari: "11",
        fx: "52",
        iron: "35",
        flock: "Infinity",
        palemoon: "25",
        camino: "Infinity",
        maxthon: "4.5",
        seamonkey: "2.3"
      },
      theme: "yellow",
      remember: false,
      onStripeShow: () => {
        if (hasAdditionalConsent()) {
          window.ym?.(87156585, "reachGoal", "outdated browser");
        }
      }
    });
  });
}

function startServices() {
  if (servicesStarted || !hasAdditionalConsent()) return;
  servicesStarted = true;
  window.ym = function () {
    (window.ym.a = window.ym.a || []).push(arguments);
  };
  window.ym.l = Date.now();
  window.ym(87156585, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true
  });
  appendScript("https://mc.yandex.ru/metrika/tag.js");
  startBrowserUpdater();
}

window.orderSuccessfullySent = () => {
  if (hasAdditionalConsent()) {
    window.ym?.(87156585, "reachGoal", "order successfully sent");
  }
};

function showBanner(event) {
  opener = event?.currentTarget;
  banner.hidden = false;
  if (opener) banner.querySelector("[data-privacy-accept]").focus();
}

function choose(allowed) {
  const wasAllowed = hasAdditionalConsent();
  const choice = saveConsent(allowed);
  banner.hidden = true;
  opener?.focus();
  window.dispatchEvent(new CustomEvent(consentEvent, {detail: choice}));
  if (allowed) {
    startServices();
  } else {
    if (servicesStarted) window.ym?.(87156585, "destruct");
    clearAnalyticsStorage();
    // Reload stops active widgets, timers and pending third-party requests.
    if (wasAllowed || servicesStarted) window.location.reload();
  }
}

if (banner) {
  document.querySelectorAll("[data-privacy-open]").forEach((button) => {
    button.hidden = false;
    button.addEventListener("click", showBanner);
  });
  banner
    .querySelector("[data-privacy-accept]")
    .addEventListener("click", () => {
      choose(true);
    });
  banner
    .querySelector("[data-privacy-reject]")
    .addEventListener("click", () => {
      choose(false);
    });
  const choice = getConsent();
  if (!choice) showBanner();
  if (choice?.allowed) startServices();
  else clearAnalyticsStorage();

  window.addEventListener("storage", (event) => {
    if (event.key !== consentKey && event.key !== null) return;
    // Apply revocation or a changed decision in other tabs as well.
    delete window.bergPrivacyChoice;
    window.location.reload();
  });
}
