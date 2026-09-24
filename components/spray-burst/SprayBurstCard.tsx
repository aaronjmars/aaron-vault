"use client";

import { themeRgbCss } from "../../lib/animation-theme";

import { useEffect, useRef } from "react";
import { SprayBurst } from "./engine";
import { CARD_BG } from "./params";
import { onTransitionChange } from "../../lib/view-transition";

export function SprayBurstCard({
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

    let engine: SprayBurst | null = null;
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
      engine = new SprayBurst(canvas);
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
      engine?.setPointer(e.clientX - r.left, e.clientY - r.top);
    };
    const onLeave = () => engine?.setPointer(null, null);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointercancel", onLeave);

    let rt = 0;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(() => {
        engine?.resize();

        if (engine && (reduced || !onScreen || hidden)) engine.renderStill();
      }, 120);
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
      aria-label="A screenprint on cream paper that changes every three seconds, each time in new colours: rings each broken by a turning gap, a pinwheel of wedges, a many-pointed starburst jumping around its plate, a field of dots swelling under a passing wave, thick bars sliding across each other, and a crowd of circles drifting together into blobs. Every edge is a fine spray of dots rather than a clean line, and the whole print shivers as if redrawn by hand on every frame. Moving the pointer across it lays the ink on more heavily under your hand."
      style={{
        ...(viewTransitionName ? { viewTransitionName } : null),
        backgroundColor: themeRgbCss("background", CARD_BG),
      }}
      className="relative mx-auto aspect-[1344/820] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export default SprayBurstCard;
