"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };
type Root = {
  points: Point[];
  dir: number;
  width: number;
  growing: boolean;
  maxLen: number;
};

const DOWN = Math.PI / 2;
const PRIMARIES = 5;
const MAX_ROOTS = 28;
const STEP = 2.6;

// Roots growing and branching downward, scoped to a card; animates only while hovered.
export function RootsCanvas() {
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
    let roots: Root[] = [];
    let cycleAlpha = 1;
    let doneFrames = 0;

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
      roots = [];
      for (let i = 0; i < PRIMARIES; i += 1) {
        roots.push({
          points: [{ x: rnd(width * 0.1, width * 0.9), y: rnd(-6, 0) }],
          dir: DOWN + rnd(-0.25, 0.25),
          width: rnd(1.8, 2.8),
          growing: true,
          maxLen: Math.round(rnd(40, 80)),
        });
      }
      cycleAlpha = 1;
      doneFrames = 0;
    };

    const frame = () => {
      ctx.clearRect(0, 0, width, height);
      if (!roots.length) seed();

      let anyGrowing = false;
      const sprouted: Root[] = [];
      for (const root of roots) {
        if (!root.growing) continue;
        anyGrowing = true;
        const tip = root.points[root.points.length - 1];
        root.dir = Math.max(DOWN - 0.7, Math.min(DOWN + 0.7, root.dir + rnd(-0.18, 0.18)));
        const nx = tip.x + Math.cos(root.dir) * STEP;
        const ny = tip.y + Math.sin(root.dir) * STEP;
        root.points.push({ x: nx, y: ny });

        if (ny >= height || root.points.length >= root.maxLen) {
          root.growing = false;
        } else if (
          roots.length + sprouted.length < MAX_ROOTS &&
          root.width > 0.9 &&
          Math.random() < 0.025
        ) {
          sprouted.push({
            points: [{ x: nx, y: ny }],
            dir: root.dir + (Math.random() < 0.5 ? -1 : 1) * rnd(0.3, 0.7),
            width: root.width * 0.7,
            growing: true,
            maxLen: Math.round(root.maxLen * 0.6),
          });
        }
      }
      roots.push(...sprouted);

      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(226, 241, 255, 0.5)";
      for (const root of roots) {
        const pts = root.points;
        for (let i = 1; i < pts.length; i += 1) {
          ctx.globalAlpha = cycleAlpha * 0.55;
          ctx.lineWidth = Math.max(0.4, root.width * (1 - 0.7 * (i / root.maxLen)));
          ctx.beginPath();
          ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
          ctx.lineTo(pts[i].x, pts[i].y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      if (!anyGrowing) {
        doneFrames += 1;
        if (doneFrames > 50) {
          cycleAlpha -= 0.03;
          if (cycleAlpha <= 0) seed();
        }
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (reduceMotion || raf) return;
      seed();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      roots = [];
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
