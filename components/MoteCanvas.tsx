"use client";

import { useEffect, useRef } from "react";

type Mote = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  twinkle: number;
};

// Slow drifting compost motes that gently rise and twinkle, scoped to a card;
// animates only while hovered.
export function MoteCanvas() {
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
    let width = 0;
    let height = 0;
    let raf = 0;
    let motes: Mote[] = [];

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

    const seed = () => {
      const count = Math.round(Math.max(28, Math.min(70, (width * height) / 1400)));
      motes = Array.from({ length: count }, () => ({
        x: rnd(0, width),
        y: rnd(0, height),
        r: rnd(0.6, 2.1),
        vx: rnd(-0.12, 0.12),
        vy: rnd(-0.35, -0.08),
        phase: rnd(0, Math.PI * 2),
        twinkle: rnd(0.01, 0.03),
      }));
    };

    const frame = () => {
      ctx.clearRect(0, 0, width, height);
      for (const m of motes) {
        m.x += m.vx;
        m.y += m.vy;
        m.phase += m.twinkle;
        // gentle horizontal sway
        m.x += Math.sin(m.phase) * 0.18;

        // wrap: motes rise and reappear from the bottom
        if (m.y < -4) {
          m.y = height + 4;
          m.x = rnd(0, width);
        }
        if (m.x < -4) m.x = width + 4;
        else if (m.x > width + 4) m.x = -4;

        const alpha = 0.28 + 0.32 * (0.5 + 0.5 * Math.sin(m.phase));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "rgba(232, 242, 214, 1)";
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (reduceMotion || raf) return;
      if (!motes.length) seed();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
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
