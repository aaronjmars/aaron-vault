"use client";

import { themeColor } from "../../lib/animation-theme";
import { useEffect, useRef } from "react";
import { RealitySplit, type RealitySplitOptions } from "./engine";
import { PALETTES, VARIANTS, PALETTE } from "./params";
import { onTransitionChange } from "../../lib/view-transition";

export function RealitySplitCard({
  bare = false,
  viewTransitionName,
  ...opts
}: {
  bare?: boolean;
  viewTransitionName?: string;
} & RealitySplitOptions = {}) {
  void bare;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const first = (opts.variants ?? VARIANTS)[0];
  const firstPal =
    typeof first?.palette === "string"
      ? (PALETTES[first.palette] ?? PALETTE)
      : (first?.palette ?? (typeof opts.palette === "string" ? PALETTES[opts.palette] : opts.palette) ?? PALETTE);
  const firstBg = firstPal.bg;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: RealitySplit | null = null;
    let onScreen = false;
    let hidden = false;
    let inTransition = false;

    const sync = () => {
      if (!engine || reduced) return;
      if (onScreen && !hidden && !inTransition) engine.start();
      else engine.stop();
    };

    const raf = requestAnimationFrame(() => {
      if (!canvasRef.current) return;
      engine = new RealitySplit(canvas, opts);
      if (!engine.ok) return;
      if (reduced) engine.renderStill();
      else sync();
    });

    const io = new IntersectionObserver(
      (es) => {
        onScreen = es[0]?.isIntersecting ?? false;
        sync();
      },
      { threshold: 0.2 },
    );
    io.observe(canvas);

    const onVis = () => {
      hidden = document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVis);
    const offTransition = onTransitionChange((active) => {
      inTransition = active;
      sync();
    });

    let rt = 0;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(() => engine?.resize(), 120);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      window.removeEventListener("resize", onResize);
      window.clearTimeout(rt);
      engine?.destroy();
    };

  }, []);

  return (
    <div
      data-canvas-card
      role="img"
      aria-label={`A word sits selected in a design tool, each letter in its own box with corner handles. The letters split apart, scatter across the card, get inspected one at a time at huge scale, then collapse to a dot and snap back together as the whole word.`}

      style={{ backgroundColor: themeColor("background", firstBg), ...(viewTransitionName ? { viewTransitionName } : null) }}
      className="relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export default RealitySplitCard;
