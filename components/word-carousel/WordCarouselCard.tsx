"use client";

import { themeColor } from "../../lib/animation-theme";

import { useEffect, useRef } from "react";
import { WordCarousel } from "./engine";
import { onTransitionChange } from "../../lib/view-transition";

export function WordCarouselCard({
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

    let engine: WordCarousel | null = null;
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
      engine = new WordCarousel(canvas);
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
    };
  }, []);

  return (
    <div
      data-canvas-card
      role="img"
      aria-label="Four dark navy words on white - Type, Grid, Color, Motion - arranged as a small word, a large word, and another small word on one line. Every half second the row slams one position to the left with a horizontal motion blur, cycling which word is large."
      style={{ ...(viewTransitionName ? { viewTransitionName } : null), backgroundColor: themeColor("background", "#ffffff") }}
      className="relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-white"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

export default WordCarouselCard;
