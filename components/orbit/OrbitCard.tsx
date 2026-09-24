"use client";

import { themeColor } from "../../lib/animation-theme";

import { useEffect, useRef } from "react";
import { Orbit } from "./engine";
import { onTransitionChange } from "../../lib/view-transition";

export function OrbitCard({
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

    let engine: Orbit | null = null;
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
      engine = new Orbit(canvas);
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

    let lastClientX = 0;
    let lastClientY = 0;
    let havePointer = false;

    const push = () => {
      if (!havePointer) return;
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      engine?.setPointer({
        x: (lastClientX - r.left) / r.width,
        y: (lastClientY - r.top) / r.height,
      });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      havePointer = true;
      push();
    };
    const onScroll = () => push();
    const onLeave = () => {
      engine?.setPointer(null);
      engine?.dragEnd();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", onLeave);

    let dragT = 0;
    let claimed = false;
    let startX = 0;
    let startY = 0;
    const frac = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    };
    const onDown = (e: PointerEvent) => {
      const p = frac(e);
      if (!p) return;
      startX = p.x;
      startY = p.y;
      claimed = e.pointerType === "mouse";
      dragT = performance.now();
      if (claimed) {
        canvas.setPointerCapture(e.pointerId);
        engine?.dragStart(p);
      }
    };
    const onDrag = (e: PointerEvent) => {
      const p = frac(e);
      if (!p) return;
      if (!claimed) {

        const dx = Math.abs(p.x - startX);
        const dy = Math.abs(p.y - startY);
        if (dx < 0.02 && dy < 0.02) return;
        if (dx <= dy) return;
        claimed = true;
        canvas.setPointerCapture(e.pointerId);
        engine?.dragStart({ x: startX, y: startY });
      }
      const now = performance.now();
      const dt = Math.min(Math.max((now - dragT) / 1000, 1 / 240), 0.1);
      dragT = now;
      engine?.dragMove(p, dt);
      e.preventDefault();
    };
    const onUp = (e: PointerEvent) => {
      if (claimed && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      claimed = false;
      engine?.dragEnd();
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onDrag);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onDrag);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      window.clearTimeout(rt);
      engine?.destroy();
    };
  }, []);

  return (
    <div
      data-canvas-card
      role="img"
      aria-label="Twenty-six named multiplayer cursors circling on an invisible sphere, growing and sharpening as they pass the front, blurring and fading as they slip behind, around a thin violet ring that slowly breathes. Now and then one of them types, clicks, or nudges itself a little off course."
      style={{ ...(viewTransitionName ? { viewTransitionName } : null), backgroundColor: themeColor("background", "#fdfdfd") }}
      className="relative mx-auto aspect-[1344/620] w-full cursor-grab select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[#fdfdfd] active:cursor-grabbing"
    >
      <canvas ref={canvasRef} className="h-full w-full cursor-none" />
    </div>
  );
}

export default OrbitCard;
