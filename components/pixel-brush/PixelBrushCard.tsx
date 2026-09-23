"use client";

import { useEffect, useRef } from "react";
import { BRUSHES, type Brush, type Ink } from "./brushes";
import { spiralPath, stroke } from "./engine";
import { onTransitionChange } from "../../lib/view-transition";

const DRAW_MS = 900;
const STAGGER_MS = 180;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const SHOWN = ["rows", "scatter-heavy", "cluster"];

const TWEAKS: Record<string, Partial<Brush>> = {
  "scatter-heavy": { size: 0.075, spacing: 0.4 },
};

const PICKED: Brush[] = SHOWN.map((id) => {
  const b = BRUSHES.find((x) => x.id === id) ?? BRUSHES[0];
  return TWEAKS[id] ? { ...b, ...TWEAKS[id] } : b;
});

const PAPER_BG = "#fbf9f7";
const INKS: Ink[] = [
  { h: 336, s: 82, l: 56 },
  { h: 212, s: 84, l: 52 },
  { h: 152, s: 62, l: 40 },
];

export function PixelBrushCard({
  bare = false,
  viewTransitionName,
}: { bare?: boolean; viewTransitionName?: string } = {}) {
  void bare;
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%";
    host.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let start = 0;
    let running = false;
    let done = false;
    let onScreen = false;
    let hidden = false;
    let inTransition = false;
    let dpr = 1;
    let cols = 4;
    let rows = 3;

    const layout = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return false;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bw = Math.round(w * dpr);
      const bh = Math.round(h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      cols = PICKED.length;
      rows = 1;
      return true;
    };

    const draw = (elapsed: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = PAPER_BG;
      ctx.fillRect(0, 0, w, h);

      const cw = host.clientWidth / cols;
      const ch = host.clientHeight / rows;
      const short = Math.min(cw, ch);

      const rMax = short * 0.38;

      PICKED.forEach((brush, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = cw * (col + 0.5);
        const cy = ch * (row + 0.5);
        const began = i * STAGGER_MS;
        const p = reduced ? 1 : easeOut(Math.min(1, Math.max(0, (elapsed - began) / DRAW_MS)));
        if (p <= 0) return;
        const path = spiralPath(cx, cy, rMax);
        stroke(ctx, path, brush, short, { progress: p, dpr, ink: INKS[i % INKS.length] });
      });
    };

    const finished = (elapsed: number) =>
      elapsed > (PICKED.length - 1) * STAGGER_MS + DRAW_MS;

    const tick = (now: number) => {
      if (!running) return;
      const elapsed = now - start;
      draw(elapsed);
      if (finished(elapsed)) {

        done = true;
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const sync = () => {
      const should = onScreen && !hidden && !inTransition;
      if (!should) {
        running = false;
        cancelAnimationFrame(raf);
        return;
      }
      if (done || running) return;
      if (reduced) {
        draw(Infinity);
        done = true;
        return;
      }
      running = true;
      start = performance.now();
      raf = requestAnimationFrame(tick);
    };

    if (!layout()) return;

    const ro = new ResizeObserver(() => {
      if (!layout()) return;

      if (done) draw(Infinity);
    });
    ro.observe(host);

    const io = new IntersectionObserver(
      (es) => {
        onScreen = es.some((e) => e.isIntersecting);
        sync();
      },
      { rootMargin: "200px" },
    );
    io.observe(host);

    const onVis = () => {
      hidden = document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVis);
    const offTransition = onTransitionChange((active) => {
      inTransition = active;
      sync();
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      data-canvas-card
      style={{ viewTransitionName }}
      aria-label="Three pixel brush swatches on one sheet: the same spiral drawn three times in pink, blue and green, as a combed ribbon, a dense spray, and a loose drift of squares"
      className="relative aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[#fbf9f7]"
    />
  );
}

export default PixelBrushCard;
