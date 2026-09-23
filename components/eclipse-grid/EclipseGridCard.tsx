"use client";

import { useEffect, useRef } from "react";
import { EclipseGrid } from "./engine";
import { GROUND, SCENE_H, SCENE_W } from "./params";
import { onTransitionChange } from "../../lib/view-transition";

export function EclipseGridCard({
  bare = false,
  viewTransitionName,
}: {
  bare?: boolean;
  viewTransitionName?: string;
} = {}) {
  void bare;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<EclipseGrid | null>(null);

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const engine = engineRef.current;
    if (!engine) return;
    const r = e.currentTarget.getBoundingClientRect();
    engine.setLight(((e.clientX - r.left) / r.width) * SCENE_W, ((e.clientY - r.top) / r.height) * SCENE_H);
  };
  const onLeave = () => engineRef.current?.clearLight();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: EclipseGrid | null = null;
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
      engine = new EclipseGrid(canvas);
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
      engine = null;
      engineRef.current = null;
    };
  }, []);

  return (
    <div
      data-canvas-card
      role="img"
      aria-label="A grid of eighty thin amber circles on a near-black field, ten across and eight down. One by one, on their own rhythms, circles slide a little up and to the left and reveal a solid amber disc behind them as a thick crescent to the lower right, then slide back and cover it again. At any moment about half the circles are empty outlines and half show a crescent, and the pattern never repeats in any visible order. Moving the pointer over the field tilts the crescents away from it, like shadows from a lamp, and eases the circles nearest to it partway open."
      onPointerMove={onPointer}
      onPointerDown={onPointer}
      onPointerLeave={onLeave}
      onPointerCancel={onLeave}
      style={{
        ...(viewTransitionName ? { viewTransitionName } : null),
        backgroundColor: GROUND,
      }}
      className="relative mx-auto aspect-[4/3] w-full touch-none select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export default EclipseGridCard;
