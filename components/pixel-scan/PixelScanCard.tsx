"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PixelScanField, drawStaticWord } from "./engine";
import { onTransitionChange } from "../../lib/view-transition";

export default function PixelScanCard({
  word = "bababooey",
}: {
  word?: string;
} = {}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: PixelScanField | null = null;
    let staticCanvas: HTMLCanvasElement | null = null;
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
        if (vis && !engine && !reduced) {
          const canvas = document.createElement("canvas");
          Object.assign(canvas.style, {
            position: "absolute",
            inset: "0",
            width: "100%",
            height: "100%",
            display: "block",
          });
          host.appendChild(canvas);
          engine = new PixelScanField(host, canvas, THREE, { word });
        }
        if (vis && reduced && !staticCanvas) {
          staticCanvas = document.createElement("canvas");
          Object.assign(staticCanvas.style, {
            position: "absolute",
            inset: "0",
            width: "100%",
            height: "100%",
            display: "block",
          });
          host.appendChild(staticCanvas);
          drawStaticWord(staticCanvas, host, word);
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

    const ro = new ResizeObserver(() => engine?.resize());
    ro.observe(host);

    return () => {
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      engine?.destroy();
      staticCanvas?.remove();
    };
  }, [word]);

  return (
    <div
      ref={hostRef}
      data-canvas-card
      aria-label="A word assembled out of a spray of tiny coloured blocks by a sweeping band; the cursor lights a pool of blocks with a lasting wake."
      className="relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[#f5f4f9]"
      style={{ ["--font-kyoto" as string]: "Georgia, serif" }}
    />
  );
}
