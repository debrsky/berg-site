function updateCurrent(items, readingLine) {
  let current = null;
  for (const item of items) {
    if (item.section.getBoundingClientRect().top <= readingLine) current = item;
  }
  for (const item of items) {
    if (item === current) item.link.setAttribute("aria-current", "location");
    else item.link.removeAttribute("aria-current");
  }
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

  let pending = false;
  const update = () => {
    pending = false;
    updateCurrent(items, Math.min(win.innerHeight * 0.3, 180));
  };
  const scheduleUpdate = () => {
    if (pending) return;
    pending = true;
    win.requestAnimationFrame(update);
  };

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
