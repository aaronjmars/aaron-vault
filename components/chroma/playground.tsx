"use client";

import { themeColor } from "../../lib/animation-theme";
import { useEffect, useRef } from "react";
import { ChromaGlow, type ChromaParams } from "./engine";
import { defaultChromaParams } from "./params";
import { PG_PREVIEW } from "../swirl/controls";

const PARAMS: ChromaParams = { ...defaultChromaParams(), word: "chrome" };

export function ChromaGlowPlayground() {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ChromaGlow | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let raf = 0;
    let started = false;
    let onScreen = true;
    const sync = () => {
      const eng = engineRef.current;
      if (!eng) return;
      if (onScreen) eng.start();
      else eng.stop();
    };
    const build = () => {
      if (started) return;
      started = true;
      raf = requestAnimationFrame(() => {
        const eng = new ChromaGlow(host, PARAMS);
        if (!eng.ok) return;
        engineRef.current = eng;
        eng.start();
        if (document.fonts?.load) {
          const probe = document.createElement("span");
          probe.style.cssText = "position:absolute;visibility:hidden;font-family:var(--font-neue-corp)";
          probe.textContent = "Ag";
          document.body.appendChild(probe);
          const fam = getComputedStyle(probe).fontFamily.split(",")[0].replace(/["']/g, "").trim();
          document.body.removeChild(probe);
          document.fonts.load(`800 1em "${fam}"`).then(() => eng.setFont(`"${fam}", sans-serif`), () => {});
        }
      });
    };
    const io = new IntersectionObserver(
      (es) => {
        onScreen = es[0]?.isIntersecting ?? false;
        if (onScreen) build();
        sync();
      },
      { rootMargin: "200px" },
    );
    io.observe(host);
    const onResize = () => engineRef.current?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* the glow */}
      <div className={`${PG_PREVIEW} aspect-[1344/620] w-full bg-[#1c2133]`} style={{ backgroundColor: themeColor("background", "#1c2133") }}>
        <div ref={hostRef} data-canvas-card className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
}

export default ChromaGlowPlayground;
