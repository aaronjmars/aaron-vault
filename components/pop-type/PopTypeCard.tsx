"use client";

import { themeColor } from "../../lib/animation-theme";
import { useEffect, useRef } from "react";
import { PopType } from "./engine";
import { FONT_VAR, FONT_WEIGHT, GROUND } from "./params";
import { onTransitionChange } from "../../lib/view-transition";

export function PopTypeCard({
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

    let engine: PopType | null = null;
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

      engine = new PopType(canvas, fam);
      if (!engine.ok) return;
      if (reduced) engine.renderStill();
      else sync();

      if (document.fonts?.load) {
        const first = fam.split(",")[0].replace(/["']/g, "").trim();
        document.fonts
          .load(`${FONT_WEIGHT} 1em "${first}"`)
          .then(() => engine?.refreshFont(), () => {});
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
    };
  }, []);

  return (
    <div
      data-canvas-card
      role="img"
      aria-label="The word Motion in chunky letters with a hard drop shadow in a second colour on a white field, set so tight each letter overlaps the next, shown at a stepped ten frames a second like a flipbook. The letters fall in one by one from the top, stretching as they drop and squashing wide as they land, their shadows arriving a beat behind, and settle. The word then swells as if inflating, slowly at first and then quickly, and pops into a ring of small dashes in the next colour that flies outward and is gone. The field sits empty for a beat before the letters fall again in a new pair of colours."
      style={{
        ...(viewTransitionName ? { viewTransitionName } : null),
        backgroundColor: themeColor("background", GROUND),
      }}
      className="relative mx-auto aspect-[9/5] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export default PopTypeCard;
