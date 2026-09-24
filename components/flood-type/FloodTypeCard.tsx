"use client";

import { themeColor } from "../../lib/animation-theme";
import { useEffect, useRef } from "react";
import { FloodType } from "./engine";
import { FONT_VAR, FONT_WEIGHT, PRESETS } from "./params";
import { onTransitionChange } from "../../lib/view-transition";

export function FloodTypeCard({
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

    let engine: FloodType | null = null;
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
      engine = new FloodType(canvas);
      if (!engine.ok) return;
      if (reduced) engine.renderStill();
      else sync();

      if (document.fonts?.load) {
        const probe = document.createElement("span");
        probe.style.cssText = `position:absolute;visibility:hidden`;
        probe.style.fontFamily = `var(${FONT_VAR})`;
        probe.textContent = "Ag";
        document.body.appendChild(probe);
        const fam = getComputedStyle(probe)
          .fontFamily.split(",")[0]
          .replace(/["']/g, "")
          .trim();
        probe.remove();
        if (fam) {
          document.fonts
            .load(`${FONT_WEIGHT} 1em "${fam}"`)
            .then(() => engine?.setFont(`"${fam}", sans-serif`), () => {});
        }
      }
    });

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      engine?.setPointer(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        ((e.clientY - r.top) / r.height) * 2 - 1,
      );
    };
    const onLeave = () => engine?.clearPointer();
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointercancel", onLeave);
    canvas.addEventListener("pointerup", onLeave);

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
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointercancel", onLeave);
      canvas.removeEventListener("pointerup", onLeave);
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
      aria-label="A two-line word sits still in heavy type, then the gap between the lines punches open, the whole word rushes toward you until it overruns the frame with each letter turned at its own angle, holds, and drops away out of the bottom before the next word arrives."
      style={{
        ...(viewTransitionName ? { viewTransitionName } : null),

        backgroundColor: themeColor("background", PRESETS[0].bg),
      }}
      className="relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export default FloodTypeCard;
