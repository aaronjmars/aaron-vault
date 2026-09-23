"use client";

import { BG } from "./params";
import { useEffect, useRef } from "react";
import { DashCascade } from "./engine";
import { onTransitionChange } from "../../lib/view-transition";

export function DashCascadeCard({
  bare = false,
  viewTransitionName,
}: {
  bare?: boolean;
  viewTransitionName?: string;
} = {}) {
  void bare;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const engineRef = useRef<DashCascade | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: DashCascade | null = null;
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
      engine = new DashCascade(canvas);
      engineRef.current = engine;
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
      engineRef.current = null;
    };
  }, []);

  return (
    <div
      data-canvas-card
      role="img"
      aria-label="Three-letter words built from fat scanline dashes in shifting yellows on white - LOL, VLT, ART, TOY - each unfurling out of a dotted vertical line letter by letter, the first letter wiping top to bottom, the last bottom to top, the middle pinched between them. The word rests at full width, folds back into the line, and the next one unfurls in its place."

      style={{
        backgroundColor: BG,
        ...(viewTransitionName ? { viewTransitionName } : null),
      }}
      className="relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"

      onPointerEnter={() => engineRef.current?.setHover(true)}
      onPointerLeave={() => engineRef.current?.setHover(false)}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export default DashCascadeCard;
