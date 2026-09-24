"use client";

import { themeColor } from "../../lib/animation-theme";
import { useEffect, useRef } from "react";
import { PhaseTable } from "./engine";
import { METALS } from "./params";
import { onTransitionChange } from "../../lib/view-transition";

export function PhaseTableCard({
  bare = false,
  viewTransitionName,
}: {
  bare?: boolean;
  viewTransitionName?: string;
} = {}) {

  void bare;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: PhaseTable | null = null;
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
      engine = new PhaseTable(canvas);
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

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      engine?.setPointer(r.width ? (e.clientX - r.left) / r.width : null);
    };
    const onLeave = () => engine?.setPointer(null);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointercancel", onLeave);

    let rt = 0;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(() => engine?.resize(), 120);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointercancel", onLeave);
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
      aria-label="A grid of glowing metal wires on a near-black field, four rows by six columns, each cell one continuous looping curve. The top-left cell is a circle and more circles run down the diagonal; away from that diagonal the curves gain lobes, becoming arches, figure-eights, waves and dense woven lattices. Each wire catches a bright reflection along one side and falls to shadow on the other, and all twenty-four breathe together on one shared sweep, flattening toward straight diagonal lines and opening back out. Moving the pointer across the card sweeps the reflection over every curve at once."

      style={{
        backgroundColor: themeColor("background", METALS[0].bg),
        ...(viewTransitionName ? { viewTransitionName } : null),
      }}
      className="relative mx-auto aspect-[1344/896] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export default PhaseTableCard;
