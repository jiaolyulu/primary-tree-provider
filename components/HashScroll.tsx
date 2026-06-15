"use client";

import { useEffect } from "react";

// When the landing page loads with a hash (e.g. arriving from /pcts via "/#pricing"),
// scroll to the target — and re-scroll briefly after load to counter layout shift
// from lazy-loaded images that would otherwise leave the jump off-target.
export function HashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;

    const scrollToTarget = () => {
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: "auto" });
    };

    scrollToTarget();
    const timer = window.setTimeout(scrollToTarget, 350);
    window.addEventListener("load", scrollToTarget);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("load", scrollToTarget);
    };
  }, []);

  return null;
}
