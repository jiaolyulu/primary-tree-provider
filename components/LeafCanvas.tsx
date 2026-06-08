"use client";

import { useEffect, useRef } from "react";

type Leaf = {
  x: number;
  y: number;
  len: number;
  vy: number;
  sway: number;
  phase: number;
  phaseSpeed: number;
  rot: number;
  vrot: number;
  tint: string;
};

const LEAF_TINTS = [
  "rgba(206, 232, 196, 0.6)",
  "rgba(228, 224, 182, 0.58)",
  "rgba(188, 222, 198, 0.55)",
];

// Leaves drifting down with a sway and slow tumble, scoped to a card; animates only while hovered.
export function LeafCanvas() {
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
    const leaves: Leaf[] = [];
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

    const spawn = (scatter: boolean): Leaf => {
      const len = rnd(9, 16);
      return {
        x: rnd(0, width),
        y: scatter ? rnd(0, height) : rnd(-30, -8),
        len,
        vy: rnd(0.4, 0.9) + (16 - len) * 0.02,
        sway: rnd(0.4, 1.1),
        phase: rnd(0, Math.PI * 2),
        phaseSpeed: rnd(0.01, 0.025),
        rot: rnd(0, Math.PI * 2),
        vrot: rnd(-0.02, 0.02),
        tint: LEAF_TINTS[Math.floor(rnd(0, LEAF_TINTS.length))],
      };
    };

    const drawLeaf = (leaf: Leaf) => {
      const w = leaf.len * 0.55;
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.rot);
      ctx.fillStyle = leaf.tint;
      ctx.beginPath();
      ctx.moveTo(0, -leaf.len / 2);
      ctx.quadraticCurveTo(w / 2, 0, 0, leaf.len / 2);
      ctx.quadraticCurveTo(-w / 2, 0, 0, -leaf.len / 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -leaf.len / 2);
      ctx.lineTo(0, leaf.len / 2);
      ctx.stroke();
      ctx.restore();
    };

    const frame = () => {
      ctx.clearRect(0, 0, width, height);
      const max = Math.max(5, Math.round((width * height) / 13000));
      while (leaves.length < max) leaves.push(spawn(true));

      for (let i = leaves.length - 1; i >= 0; i -= 1) {
        const leaf = leaves[i];
        leaf.y += leaf.vy;
        leaf.phase += leaf.phaseSpeed;
        leaf.x += Math.sin(leaf.phase) * leaf.sway;
        leaf.rot += leaf.vrot;
        if (leaf.y > height + leaf.len) {
          leaves[i] = spawn(false);
          continue;
        }
        drawLeaf(leaf);
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (reduceMotion || raf) return;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      leaves.length = 0;
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
