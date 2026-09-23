"use client";

import { useEffect, useRef } from "react";
import { AsciiWordmarkRenderer } from "./renderer";
import { onTransitionChange } from "../../lib/view-transition";

export default function AsciiWordmarkCard({
  word = "vault",
  inkColor = "#cdd3ff",
}: {
  word?: string;
  inkColor?: string;
} = {}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let engine: AsciiWordmarkRenderer | null = null;
    let inTransition = false;
    let disposed = false;

    const io = new IntersectionObserver(
      (es) => {
        const vis = es[0]?.isIntersecting ?? false;
        if (vis && !engine && !disposed) {
          const r = new AsciiWordmarkRenderer(host, { word, inkColor });
          if (!r.mount()) {
            r.dispose();
            return;
          }
          engine = r;
          if (!reduced && !inTransition) r.start();
        }
        if (!engine) return;
        if (vis && !reduced && !inTransition && !document.hidden) engine.start();
        else engine.stop();
      },
      { rootMargin: "200px" },
    );
    io.observe(host);

    const onVis = () => {
      if (document.hidden) engine?.stop();
      else if (!reduced && !inTransition) engine?.start();
    };
    document.addEventListener("visibilitychange", onVis);
    const offTransition = onTransitionChange((active) => {
      inTransition = active;
      if (active) engine?.stop();
      else if (!reduced && !document.hidden) engine?.start();
    });

    return () => {
      disposed = true;
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      engine?.dispose();
    };
  }, [word, inkColor]);

  return (
    <div
      ref={hostRef}
      data-canvas-card
      aria-label="A word spelled by thousands of particles drifting on a flow field, rendered as a live ASCII glyph grid. Move the cursor to push them and leave a glowing wake."
      className="relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"
      style={{ background: "#0b0d1a", color: inkColor }}
    />
  );
}
