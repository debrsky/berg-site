// Keep the fixed action out of the way of native CTAs and footer controls.
// Without IntersectionObserver the ordinary links remain fully usable.
export function initLandingAction(root, Observer) {
  const action = root.querySelector(".route-landing__mobile-action");
  const hero = root.querySelector(
    '[data-route-goal="calculator"][data-cta-position="hero"]'
  );
  if (!action || !hero || !Observer) return null;
  const visible = new Set();
  let heroPassed = false;
  const render = () => {
    action.hidden = !heroPassed || visible.size > 0;
  };
  // An anchor can jump from below to above the hero while its intersection
  // ratio stays zero, so IntersectionObserver alone cannot detect that jump.
  root.defaultView?.addEventListener(
    "scroll",
    () => {
      heroPassed = hero.getBoundingClientRect().bottom <= 0;
      render();
    },
    {passive: true}
  );
  const observer = new Observer((entries) => {
    for (const entry of entries) {
      if (entry.target === hero)
        heroPassed = entry.boundingClientRect.bottom <= 0;
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    render();
  });
  root
    .querySelectorAll(
      '.route-landing__actions [data-route-goal="calculator"], .landing-shell__footer'
    )
    .forEach((element) => observer.observe(element));
  return observer;
}
