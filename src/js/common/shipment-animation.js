// Reveal sealing tape once; the unmodified SVG is the complete static fallback.
export function initShipmentAnimation(root, viewport) {
  const scene = root.querySelector("[data-shipment]");
  const top = scene?.querySelector('[data-shipment-tape="top"]');
  const side = scene?.querySelector('[data-shipment-tape="side"]');
  const motion = viewport.matchMedia?.("(prefers-reduced-motion: reduce)");
  const Observer = viewport.IntersectionObserver;
  if (!top?.animate || !side?.animate || !motion || motion.matches || !Observer)
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
        top.animate(
          [
            {clipPath: "inset(0 100% 0 0) fill-box"},
            {clipPath: "inset(0 0 0 0) fill-box"}
          ],
          {duration: 520, easing: "ease-in-out", fill: "both"}
        ),
        side.animate(
          [
            {clipPath: "inset(0 0 100% 0) fill-box"},
            {clipPath: "inset(0 0 0 0) fill-box"}
          ],
          {duration: 380, delay: 520, easing: "ease-out", fill: "both"}
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
