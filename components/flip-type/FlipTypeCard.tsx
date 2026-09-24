"use client";

import { themeColor } from "../../lib/animation-theme";
import { useEffect, useRef } from "react";
import { FlipType } from "./engine";
import { FONT_VAR, FONT_WEIGHT, GROUND, SCENE_H, SCENE_W } from "./params";
import { onTransitionChange } from "../../lib/view-transition";

export function FlipTypeCard({
  bare = false,
  viewTransitionName,
}: {
  bare?: boolean;
  viewTransitionName?: string;
} = {}) {
  void bare;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FlipType | null>(null);

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const engine = engineRef.current;
    if (!engine) return;
    const r = e.currentTarget.getBoundingClientRect();
    engine.poke(((e.clientX - r.left) / r.width) * SCENE_W, ((e.clientY - r.top) / r.height) * SCENE_H);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: FlipType | null = null;
    let onScreen = false;
    let hidden = false;
    let inTransition = false;
    let cancelled = false;

    const sync = () => {
      if (!engine || reduced) return;
      if (onScreen && !hidden && !inTransition) engine.start();
      else engine.stop();
    };

    const probe = document.createElement("span");
    probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR})`;
    probe.textContent = "Ag";
    document.body.appendChild(probe);
    const fam = getComputedStyle(probe).fontFamily || "sans-serif";
    document.body.removeChild(probe);

    const go = () => {
      if (cancelled || !canvasRef.current) return;
      engine = new FlipType(canvas, fam);
      if (!reduced) engineRef.current = engine;
      if (process.env.NODE_ENV !== "production") {

        (canvas as HTMLCanvasElement & { __flipType?: FlipType }).__flipType = engine;
      }
      if (!engine.ok) return;
      if (reduced) engine.renderStill();
      else sync();
    };
    const first = fam.split(",")[0].replace(/["']/g, "").trim();
    if (document.fonts?.load) document.fonts.load(`${FONT_WEIGHT} 1em "${first}"`).then(go, go);
    else go();

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
      cancelled = true;
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
      aria-label="One bold word in butter yellow on a midnight indigo field, centred, that keeps becoming the next word: Letterform, Alignments, Hierarchies, Kerning, and back. Each change moves the line to another row. Every letter travels on its own: it hangs, then drops or climbs to the new row in a blink while its glyph flips through a few random letters, and settles. Middle letters go first, the ends last. Moving the pointer over a resting letter makes it flip through two strangers and come back."
      onPointerMove={onPointer}
      onPointerDown={onPointer}
      style={{
        ...(viewTransitionName ? { viewTransitionName } : null),
        backgroundColor: themeColor("background", GROUND),
      }}
      className="relative mx-auto aspect-[4/3] w-full touch-none select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export default FlipTypeCard;
