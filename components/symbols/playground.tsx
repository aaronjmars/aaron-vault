"use client";

import { useEffect, useRef } from "react";
import { SymbolsEffect } from "./standalone/SymbolsEffect";
import { GLYPHS } from "./glyphs";

export default function SymbolsPlayground() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let fx: SymbolsEffect | null = null;
    let canvas: HTMLCanvasElement | null = null;

    const io = new IntersectionObserver(
      (es) => {
        const vis = es[0]?.isIntersecting ?? false;
        if (vis && !fx) {
          canvas = document.createElement("canvas");
          Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });
          host.appendChild(canvas);
          fx = new SymbolsEffect(canvas, {
            cell: 14,
            // crop into the clip so the settled "Try amo" spans about 85% of the card
            zoom: 1.3,
            // dark tones get the densest marks, highlights stay bare paper
            bandColors: ["#17403f", "#2f7fbf", "#d4442c", "#e8933a"],
            bandStops: [0, 0.28, 0.55, 0.8, 1.0],
            bandGlyphs: [
              GLYPHS.findIndex((g) => g.name === "square"),
              GLYPHS.findIndex((g) => g.name === "ring"),
              GLYPHS.findIndex((g) => g.name === "diagonal"),
              GLYPHS.findIndex((g) => g.name === "empty"),
            ],
            bg: "#f7f4ef",
          });
          if (reduced) {
            fx.setImage("/vault/embroidery-weave.webp");
          } else {
            fx.setVideo("/vault/amo/amo-puff.vp9.webm");
          }
        }
        if (!vis && fx) {
          fx.dispose();
          fx = null;
          canvas?.remove();
          canvas = null;
        }
      },
      { rootMargin: "120px" },
    );
    io.observe(host);

    const ro = new ResizeObserver(() => fx?.resize());
    ro.observe(host);

    return () => {
      io.disconnect();
      ro.disconnect();
      fx?.dispose();
      canvas?.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      data-canvas-card
      aria-label="A picture rebuilt out of tiny stamped symbols, each brightness band tinted with its own colour. With motion, a video plays through the symbol grid live."
      className="relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[#f7f4ef]"
    />
  );
}
