"use client";

import { useEffect, useRef } from "react";
import { MisprintType } from "./engine";
import { FILL_WEIGHT, FONT_VAR, GROUND, OUTLINE_WEIGHT } from "./params";
import { hapticTap } from "../../lib/haptics";
import { onTransitionChange } from "../../lib/view-transition";

export function MisprintTypeCard({
  bare = false,
  viewTransitionName,
}: {
  bare?: boolean;
  viewTransitionName?: string;
} = {}) {
  void bare;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: MisprintType | null = null;
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
      const probe = document.createElement("span");
      probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR})`;
      probe.textContent = "Ag";
      document.body.appendChild(probe);
      const fam = getComputedStyle(probe).fontFamily || "sans-serif";
      document.body.removeChild(probe);

      engine = new MisprintType(canvas, fam);
      if (!engine.ok) return;
      if (reduced) engine.renderStill();
      else sync();

      if (document.fonts?.load) {
        const first = fam.split(",")[0].replace(/["']/g, "").trim();
        Promise.all([
          document.fonts.load(`${FILL_WEIGHT} 1em "${first}"`),
          document.fonts.load(`${OUTLINE_WEIGHT} 1em "${first}"`),
        ]).then(() => engine?.refreshFont(), () => {});
      }
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

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const u = ((e.clientX - r.left) / r.width) * 2 - 1;
      const v = ((e.clientY - r.top) / r.height) * 2 - 1;
      engine?.point(u, v);
    };
    const onLeave = () => {
      engine?.point(null);
      engine?.hold(false);
    };

    const onDown = (e: PointerEvent) => {
      onMove(e);
      hapticTap();
      engine?.hold(true);
    };
    const onUp = () => engine?.hold(false);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointerup", onUp);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointercancel", onLeave);

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
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointercancel", onLeave);
      offTransition();
      window.removeEventListener("resize", onResize);
      window.clearTimeout(rt);
      engine?.destroy();
      engine = null;
    };
  }, []);

  return (
    <div
      ref={hostRef}
      data-canvas-card
      role="img"
      aria-label="The words HOLD ON in tall warm-white capitals on a hot orange field, two lines, with a thin black outline that does not line up with the white letters, as if the outline had been printed slightly off, and slivers of holographic foil showing at the letter edges. The white ink carries faint vertical streaks and tiny pinholes, like a screen print. Pointing at the picture tilts it a little; the outline slides across the white with a soft shadow and the foil changes colour. Every few seconds a new sheet goes through and the outline lands somewhere else. Pressing and holding pulls everything exactly onto the white; letting go lets it slip again."
      style={{
        ...(viewTransitionName ? { viewTransitionName } : null),
        backgroundColor: GROUND,
      }}
      className="relative mx-auto aspect-[2/1] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export default MisprintTypeCard;
