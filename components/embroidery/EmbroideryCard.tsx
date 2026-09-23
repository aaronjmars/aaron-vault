"use client";

import { useEffect, useRef } from "react";
import { Embroidery } from "./engine";
import { onTransitionChange } from "../../lib/view-transition";

export default function EmbroideryCard() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: Embroidery | null = null;
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
        const nowVisible = es[0]?.isIntersecting ?? false;
        if (nowVisible && onScreen !== nowVisible && !engine) {
          engine = new Embroidery(host);
        }
        onScreen = nowVisible;
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

    const ro = new ResizeObserver(() => engine?.resize());
    ro.observe(host);

    if (reduced && !engine) engine = new Embroidery(host);
    if (reduced) engine?.renderStill();

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
      aria-label="Embroidered word patches stitched onto dark fabric, lit as real thread. Move the cursor to sweep the light across the stitching."
      className="relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"
      style={{ background: "rgb(33,26,41)" }}
    />
  );
}
