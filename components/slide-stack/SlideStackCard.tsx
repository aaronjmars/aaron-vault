"use client";

import { useEffect, useRef } from "react";
import { SlideStack } from "./engine";
import { onTransitionChange } from "../../lib/view-transition";

function cardFraction(el: HTMLElement, cx: number, cy: number) {
  const r = el.getBoundingClientRect();
  const s = Math.min(r.width, r.height);
  if (s <= 0 || r.width <= 0) return null;
  return {
    x: (cx - r.left) / r.width,
    y: (cy - r.top - (r.height - s) / 2) / s,
  };
}

export function SlideStackCard({
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

    let engine: SlideStack | null = null;
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
      engine = new SlideStack(canvas);
      if (!engine.ok) return;
      if (reduced) engine.renderStill();
      else sync();

      if (document.fonts?.load) {
        const probe = document.createElement("span");
        probe.style.cssText = "position:absolute;visibility:hidden";
        probe.style.fontFamily = "var(--font-neue-montreal)";
        probe.textContent = "Ag";
        document.body.appendChild(probe);
        const fam = getComputedStyle(probe)
          .fontFamily.split(",")[0]
          .replace(/["']/g, "")
          .trim();
        probe.remove();
        if (fam) {
          document.fonts
            .load(`600 1em "${fam}"`)
            .then(() => engine?.setFont(`"${fam}", sans-serif`), () => {});
        }
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

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      engine?.setPointer(cardFraction(canvas, e.clientX, e.clientY));
    };
    const onLeave = () => engine?.setPointer(null);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    window.addEventListener("blur", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      window.clearTimeout(rt);
      engine?.destroy();
    };
  }, []);

  return (
    <div
      data-canvas-card
      role="img"
      aria-label="Five dark blocks on an orange field, sliding between a left and a right stop. Each row starts a beat after the one above it, so the movement falls down the stack as a wave and the blocks' leading edges trace a shifting diagonal."
      style={viewTransitionName ? { viewTransitionName } : undefined}
      className="relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[#dedede]"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export default SlideStackCard;
