"use client";

import { useEffect, useRef } from "react";
import { BlurGlow } from "./engine";
import { onTransitionChange } from "../../lib/view-transition";

export default function BlurGlowCard() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: BlurGlow | null = null;
    let onScreen = false;
    let hidden = false;
    let inTransition = false;
    let fontReady = false;

    const sync = () => {
      if (!engine) return;
      if (onScreen && !hidden && !inTransition) engine.start();
      else engine.stop();
    };

    const io = new IntersectionObserver(
      (es) => {
        const vis = es[0]?.isIntersecting ?? false;
        if (vis && !engine) engine = new BlurGlow(host);
        onScreen = vis;
        sync();
      },
      { rootMargin: "200px" },
    );
    io.observe(host);

    const onVis = () => {
      hidden = document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVis);
    const offTransition = onTransitionChange((active) => {
      inTransition = active;
      sync();
    });

    const ro = new ResizeObserver(() => engine?.onResize());
    ro.observe(host);

    if (reduced && !engine) {
      engine = new BlurGlow(host);
      engine.renderStill(true);
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (fontReady) return;
        fontReady = true;
        engine?.refreshFont();
      });
    }

    return () => {
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      engine?.destroy();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      data-canvas-card
      aria-label="A crisp word in a soft gradient-mapped glow that breathes, drifts through colour worlds, and bends around the cursor."
      className="relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"
    />
  );
}
