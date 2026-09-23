"use client";

import { useEffect, useRef, useState } from "react";
import { SiriWave } from "./engine";
import { onTransitionChange } from "../../lib/view-transition";

export function SiriWaveCard({ bare = false }: { bare?: boolean } = {}) {
  void bare;
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SiriWave | null>(null);
  const [mic, setMic] = useState<"off" | "on" | "denied">("off");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: SiriWave | null = null;
    let raf = 0;
    let created = false;
    let onScreen = false;
    let hidden = false;
    let inTransition = false;

    const running = () => onScreen && !hidden && !inTransition;
    const sync = () => {
      if (!engine || reduced) return;
      if (running()) engine.start();
      else engine.stop();
    };

    const create = () => {
      if (created) return;
      created = true;
      raf = requestAnimationFrame(() => {
        if (!hostRef.current) return;
        engine = new SiriWave(host);
        engineRef.current = engine;
        if (!engine.ok) return;
        if (reduced) engine.renderStill();
        else sync();
      });
    };

    const io = new IntersectionObserver(
      (es) => {
        onScreen = es.some((e) => e.isIntersecting);
        if (onScreen && !created) create();
        if (created) sync();
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

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      cancelAnimationFrame(raf);
      engine?.destroy();
      engineRef.current = null;
    };
  }, []);

  const toggleMic = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.micLive) {
      engine.disableMic();
      setMic("off");
      return;
    }
    const ok = await engine.enableMic();
    setMic(ok ? "on" : "denied");
  };

  return (
    <div
      ref={hostRef}
      data-canvas-card
      role="img"
      aria-label="A ribbon of light rippling like a voice assistant listening, four spectral copies of one wave that split into a rainbow where the curve bends. Driven by the microphone when allowed, otherwise by a simulated voice."
      className="relative aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[var(--bg-surface)]"
    >
      <button
        onClick={toggleMic}
        style={{
          position: "absolute",
          right: 12,
          top: 12,
          zIndex: 2,
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          padding: "6px 12px",
          borderRadius: 999,
          border: "1px solid var(--border-line)",
          background: "color-mix(in srgb, var(--bg-surface) 82%, transparent)",
          color: "inherit",
          cursor: "pointer",
          backdropFilter: "blur(4px)",
        }}
      >
        {mic === "on" ? "Stop microphone" : mic === "denied" ? "Mic unavailable" : "Use microphone"}
      </button>
    </div>
  );
}

export default SiriWaveCard;
