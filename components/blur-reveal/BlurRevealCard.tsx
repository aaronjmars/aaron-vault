"use client";

import { themeColor } from "../../lib/animation-theme";
import { useEffect, useRef } from "react";
import { BlurReveal } from "./engine";
import { onTransitionChange } from "../../lib/view-transition";

export default function BlurRevealCard() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: BlurReveal | null = null;
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
        if (vis && !engine) {
          engine = new BlurReveal(host);
          if (reduced) engine.renderStill();
        }
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
      aria-label="Vivid colour panels cycling one at a time, each line of serif text dissolving in through a cloudy blur and resolving into focus."
      className="relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"
      style={{ background: themeColor("background", "#0b3d3a") }}
    />
  );
}
