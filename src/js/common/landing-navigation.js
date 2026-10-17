function updateCurrent(items, readingLine) {
  let current = null;
  for (const item of items) {
    if (item.section.getBoundingClientRect().top <= readingLine) current = item;
  }
  for (const item of items) {
    if (item === current) item.link.setAttribute("aria-current", "location");
    else item.link.removeAttribute("aria-current");
  }
  return current;
}

function measureNavigation(root, win, navigation) {
  if (!navigation) return 0;
  const height =
    win.getComputedStyle(navigation).position === "sticky"
      ? navigation.getBoundingClientRect().height
      : 0;
  root.documentElement.style.setProperty("--landing-nav-height", height + "px");
  return height;
}

function revealCurrent(navigation, link) {
  if (!navigation || !link) return;
  const left = link.offsetLeft;
  const right = left + link.offsetWidth;
  if (left < navigation.scrollLeft) navigation.scrollLeft = left;
  else if (right > navigation.scrollLeft + navigation.clientWidth)
    navigation.scrollLeft = right - navigation.clientWidth;
}

function createHighlight(items, win) {
  const motion = win.matchMedia("(prefers-reduced-motion: reduce)");
  let arrival;
  motion.addEventListener?.("change", () => arrival?.cancel());
  return () => {
    arrival?.cancel();
    const item = items.find(
      ({link}) => link.getAttribute("href") === win.location.hash
    );
    const heading = item?.section.querySelector("h2");
    if (!heading?.animate || motion.matches) return;
    arrival = heading.animate(
      [
        {
          backgroundColor: "var(--surface-raised)",
          boxShadow: "-0.5rem 0 0 var(--route-accent)"
        },
        {backgroundColor: "transparent", boxShadow: "-0.5rem 0 0 transparent"}
      ],
      {duration: 1300, easing: "ease-out"}
    );
  };
}

// Native anchors remain usable without JS; scrolling never rewrites the URL.
export function initLandingNavigation(root, win) {
  const links = root.querySelectorAll(
    '.route-landing__navigation a[href^="#"]'
  );
  const items = Array.from(links, (link) => ({
    link,
    section: root.getElementById(link.getAttribute("href").slice(1))
  })).filter((item) => item.section);
  if (!items.length) return;

  const navigation = root.querySelector?.(".route-landing__navigation");
  let pending = false;
  let previous;
  const update = () => {
    pending = false;
    const height = measureNavigation(root, win, navigation);
    const current = updateCurrent(
      items,
      Math.max(height + 24, Math.min(win.innerHeight * 0.3, 180))
    );
    if (current !== previous) revealCurrent(navigation, current?.link);
    previous = current;
  };
  const scheduleUpdate = () => {
    if (pending) return;
    pending = true;
    win.requestAnimationFrame(update);
  };

  if (navigation && win.ResizeObserver) {
    const observer = new win.ResizeObserver(scheduleUpdate);
    observer.observe(navigation);
  }
  const highlight = createHighlight(items, win);
  win.addEventListener("scroll", scheduleUpdate, {passive: true});
  win.addEventListener("resize", scheduleUpdate);
  win.addEventListener("hashchange", () => {
    scheduleUpdate();
    highlight();
  });
  for (const {link} of items) {
    link.addEventListener("click", (event) => {
      // A repeated anchor click does not emit hashchange. Do not intercept it.
      if (
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      if (link.getAttribute("href") === win.location.hash) highlight();
    });
  }
  update();
  highlight();
}
