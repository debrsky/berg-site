// Standalone landing: no city detection, site menus or DaData initialization.
import "./common/theme.js";
import {initLandingAction} from "./common/landing-action.js";
import {initForkliftAnimation} from "./common/forklift-animation.js";

initLandingAction(document, window.IntersectionObserver);
initForkliftAnimation(document, window);
