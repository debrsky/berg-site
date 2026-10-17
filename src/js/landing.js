// Standalone landing: no city detection, site menus or DaData initialization.
import "./common/theme.js";
import {initLandingAction} from "./common/landing-action.js";
import {initForkliftAnimation} from "./common/forklift-animation.js";
import {initPhoneCopy} from "./common/phone-copy.js";
import {initLandingNavigation} from "./common/landing-navigation.js";
import {initTariffDisclosure} from "./common/tariff-disclosure.js";

initLandingAction(document, window.IntersectionObserver);
initForkliftAnimation(document, window);
initPhoneCopy(document, window);
initLandingNavigation(document, window);
initTariffDisclosure(document);
