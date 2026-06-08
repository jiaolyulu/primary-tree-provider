"use client";

import { useEffect, useRef } from "react";

type Bubble = {
  x: number;
  y: number;
  r: number;
  vy: number;
  drift: number;
  phase: number;
  alpha: number;
};

const CONFIG = {
  intensity: 1.0,
  ringColor: "rgba(226, 241, 255, 0.55)",
  fillColor: "rgba(226, 241, 255, 0.07)",
  highlightColor: "rgba(255, 255, 255, 0.7)",
};

// Soft oxygen bubbles rising and drifting, scoped to a card; animates only while hovered.
export function BubbleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const card = canvas.parentElement;
    if (!card) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bubbles: Bubble[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;

    const rnd = (min: number, max: number) => Math.random() * (max - min) + min;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const spawn = (scatter: boolean): Bubble => {
      const r = rnd(3, 9);
      return {
        x: rnd(r, Math.max(r + 1, width - r)),
        y: scatter ? rnd(0, height) : height + r + rnd(0, 40),
        r,
        vy: rnd(0.6, 1.4) + (9 - r) * 0.05,
        drift: rnd(0.2, 0.8),
        phase: rnd(0, Math.PI * 2),
        alpha: 0,
      };
    };

    const frame = () => {
      ctx.clearRect(0, 0, width, height);

      const maxBubbles = Math.max(6, Math.round(((width * height) / 9000) * CONFIG.intensity));
      while (bubbles.length < maxBubbles) bubbles.push(spawn(true));

      for (let i = bubbles.length - 1; i >= 0; i -= 1) {
        const b = bubbles[i];
        b.y -= b.vy;
        b.phase += 0.03;
        b.x += Math.sin(b.phase + b.y * 0.02) * b.drift;

        // fade in from the bottom, fade out near the top
        const fadeIn = Math.min(1, (height - b.y) / 70);
        const fadeOut = Math.min(1, (b.y + b.r * 2) / 90);
        b.alpha = Math.max(0, Math.min(0.9, fadeIn, fadeOut));

        if (b.y < -b.r * 2) {
          bubbles[i] = spawn(false);
          continue;
        }

        ctx.globalAlpha = b.alpha;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.fillColor;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = CONFIG.ringColor;
        ctx.stroke();

        ctx.globalAlpha = b.alpha * 0.8;
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, Math.max(0.6, b.r * 0.18), 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.highlightColor;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (reduceMotion || raf) return;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      bubbles.length = 0;
      ctx.clearRect(0, 0, width, height);
    };

    card.addEventListener("mouseenter", start);
    card.addEventListener("mouseleave", stop);

    return () => {
      card.removeEventListener("mouseenter", start);
      card.removeEventListener("mouseleave", stop);
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="pricing-fx-canvas" aria-hidden="true" />;
}
