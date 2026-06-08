"use client";

import { useEffect, useRef } from "react";

type Drop = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  width: number;
  opacity: number;
};

type Splash = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  decay: number;
};

const CONFIG = {
  intensity: 1.0,
  gravity: 6.0,
  wind: 1.4,
  dropLength: 1.7,
  dropWidth: 1.3,
  rainColor: "rgba(226, 241, 255, 0.65)",
  splashColor: "rgba(226, 241, 255, 0.8)",
};

// Rich canvas rainfall scoped to a single card; animates only while hovered.
export function RainCanvas() {
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
    const drops: Drop[] = [];
    const splashes: Splash[] = [];
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

    const frame = () => {
      ctx.clearRect(0, 0, width, height);

      const maxDrops = Math.round(((width * height) / 2500) * CONFIG.intensity);
      while (drops.length < maxDrops) {
        drops.push({
          x: rnd(-40, width + 40),
          y: rnd(-height, -10),
          vy: CONFIG.gravity * rnd(1.1, 1.8),
          vx: CONFIG.wind + rnd(-0.6, 0.6),
          length: CONFIG.dropLength * rnd(0.8, 1.3),
          width: CONFIG.dropWidth * rnd(0.7, 1.2),
          opacity: rnd(0.35, 0.7),
        });
      }

      ctx.lineCap = "round";
      ctx.strokeStyle = CONFIG.rainColor;
      for (let i = drops.length - 1; i >= 0; i -= 1) {
        const drop = drops[i];
        drop.y += drop.vy;
        drop.x += drop.vx;

        if (drop.y >= height - 4) {
          const count = Math.round(rnd(2, 4));
          for (let s = 0; s < count; s += 1) {
            const angle = -Math.PI / 2 + rnd(-0.7, 0.7);
            const speed = rnd(1.2, 3.0);
            splashes.push({
              x: drop.x,
              y: height - 4,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: rnd(0.5, 1.4),
              alpha: 1,
              decay: rnd(0.03, 0.06),
            });
          }
          drop.x = rnd(-40, width + 40);
          drop.y = rnd(-40, -10);
          drop.vy = CONFIG.gravity * rnd(1.1, 1.8);
        } else {
          ctx.lineWidth = drop.width;
          ctx.globalAlpha = drop.opacity;
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - drop.vx * drop.length * 0.5, drop.y - drop.vy * drop.length * 0.5);
          ctx.stroke();
        }
      }

      ctx.fillStyle = CONFIG.splashColor;
      for (let i = splashes.length - 1; i >= 0; i -= 1) {
        const splash = splashes[i];
        splash.vy += 0.12;
        splash.x += splash.vx;
        splash.y += splash.vy;
        splash.alpha -= splash.decay;
        if (splash.alpha <= 0.02) {
          splashes.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = splash.alpha;
        ctx.beginPath();
        ctx.arc(splash.x, splash.y, splash.radius, 0, Math.PI * 2);
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
      drops.length = 0;
      splashes.length = 0;
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
