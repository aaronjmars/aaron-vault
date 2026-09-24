"use client";

import { themeColor } from "../../lib/animation-theme";

import { useEffect, useRef } from "react";
import { LoudBurst } from "./engine";
import { FONT_CSS, FONT_WEIGHT } from "./params";
import { onTransitionChange } from "../../lib/view-transition";

export function LoudBurstCard({
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

    let engine: LoudBurst | null = null;
    let onScreen = false;
    let hidden = false;
    let inTransition = false;
    let started = false;

    const sync = () => {
      if (!engine || reduced) return;
      if (onScreen && !hidden && !inTransition) engine.start();
      else engine.stop();
    };

    const resolveFamily = () => {
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden";
      probe.style.fontFamily = FONT_CSS;
      probe.textContent = "Ag";
      document.body.appendChild(probe);
      const fam = getComputedStyle(probe)
        .fontFamily.split(",")[0]
        .replace(/["']/g, "")
        .trim();
      probe.remove();
      return fam;
    };

    const startEngine = (family?: string) => {
      if (started || !canvasRef.current) return;
      started = true;
      engine = new LoudBurst(canvas, family ? `"${family}", sans-serif` : undefined);
      if (!engine.ok) return;
      if (reduced) engine.renderStill();
      else sync();
    };

    const hasFontApi =
      typeof document !== "undefined" && "fonts" in document && !!document.fonts;
    const raf = requestAnimationFrame(() => {
      if (!canvasRef.current) return;
      const fam = hasFontApi ? resolveFamily() : "";
      if (hasFontApi && fam) {
        const to = window.setTimeout(() => startEngine(fam), 350);
        const go = () => {
          window.clearTimeout(to);
          startEngine(fam);
        };
        document.fonts.load(`${FONT_WEIGHT} 1em "${fam}"`).then(go, go);
      } else {
        startEngine();
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
    };
  }, []);

  return (
    <div
      data-canvas-card
      role="img"
      aria-label="A sentence types itself onto white paper one word at a time, each word landing slightly blurred and snapping into focus. The word loud takes on vivid colour, trembles, and dissolves into colourful drawn strokes that scatter in every direction while the rest of the sentence rushes off the sides. A few last strokes sweep the paper clean, and a different sentence begins the loop in a different palette."
      style={{ ...(viewTransitionName ? { viewTransitionName } : null), backgroundColor: themeColor("background", "#fdfdfd") }}
      className="relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[#fdfdfd]"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export default LoudBurstCard;
