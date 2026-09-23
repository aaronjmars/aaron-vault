"use client";

import { useEffect, useRef } from "react";
import { DesignTiles } from "./engine";
import { onTransitionChange } from "../../lib/view-transition";

export default function DesignTilesCard() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: DesignTiles | null = null;
    let onScreen = false;
    let hidden = false;
    let inTransition = false;

    const sync = () => {
      if (!engine) return;
      if (onScreen && !hidden && !inTransition) engine.start();
      else engine.stop();
    };

    const io = new IntersectionObserver(
      (es) => {
        const vis = es[0]?.isIntersecting ?? false;
        if (vis && !engine) engine = new DesignTiles(host);
        onScreen = vis;
        if (reduced && engine) engine.renderStill();
        sync();
      },
      { rootMargin: "100px" },
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

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => engine?.refreshFont());
    }

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      engine?.destroy();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      data-canvas-card
      aria-label="The sentence 'design is how it works' as solid colour tiles that fly in, assemble into one bar, and shuffle their swatches. Hover a tile to re-roll its colour."
      className="relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[#f4f2ec]"
    />
  );
}
