// Animate the inline drawing once; the SVG itself is the static fallback.
export function initForkliftAnimation(root, viewport) {
  const scene = root.querySelector("[data-forklift]");
  const vehicle = scene?.querySelector("[data-forklift-vehicle]");
  const motion = viewport.matchMedia?.("(prefers-reduced-motion: reduce)");
  const Observer = viewport.IntersectionObserver;
  if (!vehicle?.animate || !motion || motion.matches || !Observer) return null;

  const animations = [];
  const finalTransforms = new Map();
  let played = false;
  const cleanup = () => motion.removeEventListener("change", stop);
  const release = () => {
    animations.forEach((animation) => animation.cancel());
    finalTransforms.forEach((_, part) =>
      part.removeAttribute("data-forklift-moving")
    );
    cleanup();
  };
  const settle = () => {
    // Bake the final pose into SVG geometry, not persistent compositor effects.
    if (!motion.matches)
      finalTransforms.forEach((transform, part) =>
        part.setAttribute("transform", transform)
      );
    release();
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
        vehicle.animate(
          [{transform: "translateX(16px)"}, {transform: "translateX(0)"}],
          {
            duration: 950,
            easing: "cubic-bezier(0.2, 0.6, 0.3, 1)",
            fill: "both"
          }
        )
      );
      scene.querySelectorAll("[data-forklift-wheel]").forEach((wheel) => {
        const {x, y, width, height} = wheel.getBBox();
        finalTransforms.set(
          wheel,
          `rotate(-26 ${x + width / 2} ${y + height / 2})`
        );
        wheel.setAttribute("data-forklift-moving", "");
        animations.push(
          wheel.animate(
            [{transform: "rotate(0deg)"}, {transform: "rotate(-26deg)"}],
            {
              duration: 950,
              easing: "cubic-bezier(0.2, 0.6, 0.3, 1)",
              fill: "both"
            }
          )
        );
      });
      scene.querySelectorAll("[data-forklift-lift]").forEach((part) => {
        finalTransforms.set(part, "translate(0 -12)");
        animations.push(
          part.animate(
            [{transform: "translateY(0)"}, {transform: "translateY(-12px)"}],
            {duration: 750, delay: 1050, easing: "ease-in-out", fill: "both"}
          )
        );
      });
      // Release every filled effect after playback or cancellation. Leaving
      // finished transforms attached can keep SVG layers rasterized in Chromium.
      Promise.all(animations.map((animation) => animation.finished)).then(
        settle,
        release
      );
    },
    {threshold: 0.4}
  );
  motion.addEventListener("change", stop);
  observer.observe(scene);
  return observer;
}
