// One route reveal; the unmodified SVG remains the complete static fallback.
export function initRouteSceneAnimation(root, viewport) {
  const scene = root.querySelector("[data-route-scene]");
  const line = scene?.querySelector("[data-route-line]");
  const parcel = scene?.querySelector("[data-route-parcel]");
  const motion = viewport.matchMedia?.("(prefers-reduced-motion: reduce)");
  const Observer = viewport.IntersectionObserver;
  if (
    !line?.animate ||
    !parcel?.animate ||
    !motion ||
    motion.matches ||
    !Observer
  )
    return null;

  let played = false;
  const animations = [];
  const release = () => {
    animations.forEach((animation) => animation.cancel());
    motion.removeEventListener("change", stop);
  };
  const stop = () => {
    if (!motion.matches) return;
    played = true;
    observer.disconnect();
    release();
  };
  const observer = new Observer(
    (entries) => {
      if (
        played ||
        motion.matches ||
        scene.getBoundingClientRect().width === 0 ||
        !entries.some(
          (entry) =>
            entry.target === scene &&
            entry.isIntersecting &&
            entry.intersectionRatio >= 0.4
        )
      )
        return;
      played = true;
      observer.disconnect();
      animations.push(
        line.animate(
          [
            {strokeDasharray: "1", strokeDashoffset: "1"},
            {strokeDasharray: "1", strokeDashoffset: "0"}
          ],
          {duration: 1200, easing: "ease-in-out", fill: "both"}
        ),
        parcel.animate(
          [
            {opacity: 0, transform: "translate(-12px, 10px)"},
            {opacity: 1, transform: "translate(0px, 0px)"}
          ],
          {duration: 500, delay: 450, easing: "ease-out", fill: "both"}
        )
      );
      Promise.all(animations.map((animation) => animation.finished)).then(
        release,
        release
      );
    },
    {threshold: 0.4}
  );
  motion.addEventListener("change", stop);
  observer.observe(scene);
  return observer;
}
