"use client";

import { useEffect, useRef, useState } from "react";

const EASE_IN = 1.0; // seconds to ramp speed up at the start
const EASE_OUT = 1.3; // seconds to ramp speed down before the end
const MIN_RATE = 0.35; // slowest playback rate at the very start/end

// Hero background video: plays once, eases the motion in and out, and holds the last frame.
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let raf = 0;

    const tick = () => {
      const d = video.duration;
      if (d && Number.isFinite(d)) {
        const t = video.currentTime;
        let rate = 1;
        if (t < EASE_IN) {
          rate = MIN_RATE + (1 - MIN_RATE) * (t / EASE_IN);
        } else if (t > d - EASE_OUT) {
          rate = MIN_RATE + (1 - MIN_RATE) * Math.max(0, (d - t) / EASE_OUT);
        }
        video.playbackRate = Math.max(MIN_RATE, Math.min(1, rate));
      }
      if (!video.ended && !video.paused) raf = requestAnimationFrame(tick);
    };

    const onReady = () => setReady(true);
    const onPlay = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const onEnded = () => {
      cancelAnimationFrame(raf);
      // leave currentTime at the end so the last frame stays on screen
    };

    video.addEventListener("canplay", onReady);
    video.addEventListener("play", onPlay);
    video.addEventListener("ended", onEnded);

    const attempt = video.play();
    if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});

    return () => {
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("ended", onEnded);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <video
      ref={ref}
      className={ready ? "hero-video is-ready" : "hero-video"}
      muted
      playsInline
      autoPlay
      preload="auto"
      poster="/images/pct-tree-hero.jpg"
      aria-hidden="true"
    >
      <source
        src="https://cdn.midjourney.com/video/cd2644a4-12dd-4203-9a47-1a48d365c5f7/3.mp4"
        type="video/mp4"
      />
    </video>
  );
}
