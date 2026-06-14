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

type Settled = { x: number; y: number; len: number; rot: number; tint: string };

const LEAF_TINTS = [
  "rgba(206, 232, 196, 0.6)",
  "rgba(228, 224, 182, 0.58)",
  "rgba(188, 222, 198, 0.55)",
];

const BUCKET = 9;
const MAX_FALLING = 11;
const MAX_SETTLED = 220;
const FLAT = Math.PI / 2; // leaves rest with their long axis roughly horizontal

// Leaves drifting down with a sway and slow tumble, settling into a growing pile
// at the bottom of the card; animates only while hovered.
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
    let falling: Leaf[] = [];
    let settled: Settled[] = [];
    let cols: number[] = [];
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
      // pile is tied to width; reset it when the card resizes
      cols = new Array(Math.max(1, Math.ceil(width / BUCKET))).fill(0);
      settled = [];
      falling = [];
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const spawn = (scatter = false): Leaf => {
      const len = rnd(9, 16);
      return {
        x: rnd(0, width),
        y: scatter ? rnd(0, height) : rnd(-30, -8),
        len,
        vy: rnd(2.4, 4.0) + (16 - len) * 0.05,
        sway: rnd(0.4, 1.1),
        phase: rnd(0, Math.PI * 2),
        phaseSpeed: rnd(0.01, 0.025),
        rot: rnd(0, Math.PI * 2),
        vrot: rnd(-0.02, 0.02),
        tint: LEAF_TINTS[Math.floor(rnd(0, LEAF_TINTS.length))],
      };
    };

    const colAt = (x: number) => Math.max(0, Math.min(cols.length - 1, Math.floor(x / BUCKET)));

    const drawLeaf = (leaf: { x: number; y: number; len: number; rot: number; tint: string }) => {
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

    const settle = (leaf: Leaf) => {
      const col = colAt(leaf.x);
      const surfaceY = height - cols[col];
      // leaves come to rest lying roughly flat, with a natural spread of angles
      const restRot = FLAT + rnd(-0.6, 0.6);
      settled.push({ x: leaf.x, y: surfaceY - leaf.len * 0.1, len: leaf.len, rot: restRot, tint: leaf.tint });
      // a flat leaf only adds a thin layer; spread the rise across the width it covers
      // so leaves stack as overlapping layers instead of clumping into a column
      const rise = leaf.len * 0.18;
      const cap = height * 0.82;
      const span = Math.max(1, Math.round(leaf.len / BUCKET));
      for (let d = -span; d <= span; d += 1) {
        const c = col + d;
        if (c < 0 || c >= cols.length) continue;
        const falloff = 1 - Math.abs(d) / (span + 1);
        cols[c] = Math.min(cap, cols[c] + rise * falloff);
      }
    };

    const frame = () => {
      ctx.clearRect(0, 0, width, height);

      const full = settled.length >= MAX_SETTLED;
      if (!full && falling.length < MAX_FALLING && Math.random() < 0.7) {
        falling.push(spawn());
      }

      for (let i = falling.length - 1; i >= 0; i -= 1) {
        const leaf = falling[i];
        leaf.y += leaf.vy;
        leaf.phase += leaf.phaseSpeed;
        leaf.x += Math.sin(leaf.phase) * leaf.sway;
        leaf.rot += leaf.vrot;

        const surfaceY = height - cols[colAt(leaf.x)];
        if (leaf.y + leaf.len * 0.35 >= surfaceY) {
          settle(leaf);
          falling.splice(i, 1);
          continue;
        }
        drawLeaf(leaf);
      }

      for (const leaf of settled) drawLeaf(leaf);

      // keep the loop alive while hovered so a resize (which rebuilds the pile)
      // stays correct; spawning simply stops once the pile is full
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (reduceMotion || raf) return;
      // pre-scatter a few leaves mid-air so the pile starts forming right away
      if (!falling.length && !settled.length) {
        for (let i = 0; i < 8; i += 1) falling.push(spawn(true));
      }
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      falling = [];
      settled = [];
      cols = cols.map(() => 0);
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
