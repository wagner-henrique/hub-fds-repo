"use client";

import { useEffect } from "react";

const NAVBAR_OFFSET_PX = 96;
const ANIMATION_DURATION_MS = 700;

const easeInOutCubic = (t: number) => {
  if (t < 0.5) return 4 * t * t * t;
  return 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export default function AnchorSmoothScroll() {
  useEffect(() => {
    let activeAnimationFrame: number | null = null;

    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href^="#"]') as HTMLAnchorElement | null;

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const currentUrl = new URL(window.location.href);
      const anchorUrl = new URL(anchor.href, window.location.href);

      // Só anima âncoras da mesma página.
      if (anchorUrl.pathname !== currentUrl.pathname || !anchorUrl.hash) return;

      const id = anchorUrl.hash.slice(1);
      const section = document.getElementById(id);
      if (!section) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const destinationTop = Math.max(section.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET_PX, 0);

      if (activeAnimationFrame !== null) {
        window.cancelAnimationFrame(activeAnimationFrame);
        activeAnimationFrame = null;
      }

      const startTop = window.scrollY;
      const distance = destinationTop - startTop;
      const startTime = performance.now();

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
        const easedProgress = easeInOutCubic(progress);
        const nextTop = startTop + distance * easedProgress;

        window.scrollTo({ top: nextTop, behavior: "auto" });

        if (progress < 1) {
          activeAnimationFrame = window.requestAnimationFrame(animateScroll);
          return;
        }

        activeAnimationFrame = null;
      };

      activeAnimationFrame = window.requestAnimationFrame(animateScroll);

      window.history.replaceState(null, "", `#${id}`);
    };

    // Capture=true para interceptar antes do handler do Next Link.
    document.addEventListener("click", handleAnchorClick, true);

    return () => {
      if (activeAnimationFrame !== null) {
        window.cancelAnimationFrame(activeAnimationFrame);
      }
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, []);

  return null;
}
