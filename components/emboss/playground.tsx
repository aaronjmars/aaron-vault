"use client";

import { useEffect, useRef, useState } from "react";
import { EmbossPlayground } from "./pg-engine";
import { defaultParams, type EmbossParams } from "./params";
import type { Content } from "./content-mask";
import { PG_PREVIEW } from "../swirl/controls";

const CONTENT: Content = { word: "emboss", svg: null };

export function EmbossPlayground_() {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<EmbossPlayground | null>(null);

  const [params] = useState<EmbossParams>(() => defaultParams());

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let raf = 0;
    let started = false;
    const build = () => {
      if (started) return;
      started = true;
      raf = requestAnimationFrame(() => {
        const eng = new EmbossPlayground(host, params, CONTENT);
        if (!eng.ok) return;
        engineRef.current = eng;

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
        if (es[0]?.isIntersecting) {
          io.disconnect();
          build();
        }
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
      {/* the plate */}
      <div className={`${PG_PREVIEW} aspect-[1344/620] w-full`}>
        <div ref={hostRef} data-canvas-card className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
}

export default EmbossPlayground_;
