"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { onTransitionChange } from "../../lib/view-transition";
import { Arcade } from "./engine";
import { COLORWAYS, DEFAULTS, FONT_CSS, FONT_WEIGHT } from "./params";

/* Local stand-ins for the source project's shared control primitives
   (Slider / GhostButton / SectionLabel), styled inline because this repo has
   no Tailwind. Behaviour matches: controlled range inputs and one remix
   button. */

const PREVIEW_STYLE: CSSProperties = {
  position: "relative",
  aspectRatio: "16 / 9",
  width: "100%",
  overflow: "hidden",
  borderRadius: 12,
  border: "1px solid var(--border-line)",
  background: "#111",
};

const PANEL_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  marginTop: 8,
};

const ROW_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  height: 32,
  width: "100%",
  borderRadius: 8,
  border: "1px solid var(--border-line)",
  background: "#17171b",
  padding: "0 12px",
  fontSize: 12,
  color: "#9aa",
  boxSizing: "border-box",
};

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label style={ROW_STYLE}>
      <span style={{ flexShrink: 0 }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, minWidth: 0, accentColor: "#eee" }}
      />
      <span style={{ flexShrink: 0, color: "#eee", fontVariantNumeric: "tabular-nums" }}>
        {format ? format(value) : value.toFixed(step < 0.01 ? 3 : String(step).split(".")[1]?.length || 0)}
      </span>
    </label>
  );
}

export function ArcadePlayground() {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Arcade | null>(null);

  const [word, setWord] = useState(DEFAULTS.word);
  const [threshold, setThreshold] = useState(DEFAULTS.threshold);
  const [cols, setCols] = useState(DEFAULTS.cols);
  const [keyline, setKeyline] = useState(DEFAULTS.keyline);
  const [shadow, setShadow] = useState(DEFAULTS.keylineOffset[0]);
  const [separation, setSeparation] = useState(DEFAULTS.separation);
  const [swim, setSwim] = useState(DEFAULTS.swim);
  const [pull, setPull] = useState(DEFAULTS.pull);
  const [magnetReach, setMagnetReach] = useState(DEFAULTS.magnetReach);
  const [texture, setTexture] = useState(DEFAULTS.texture);
  const [colorway, setColorway] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: Arcade | null = null;
    let onScreen = false;
    let hidden = false;
    let inTransition = false;
    let started = false;

    const sync = () => {
      if (!engine || reduced) return;
      if (onScreen && !hidden && !inTransition) engine.start();
      else engine.stop();
    };

    const resolveFamily = () => {
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden";
      probe.style.fontFamily = FONT_CSS;
      probe.textContent = "Ag";
      document.body.appendChild(probe);
      const fam = getComputedStyle(probe)
        .fontFamily.split(",")[0]
        .replace(/["']/g, "")
        .trim();
      probe.remove();
      return fam;
    };

    const startEngine = (family?: string) => {
      if (started || !hostRef.current) return;
      started = true;
      engine = new Arcade(host, family ? `"${family}", sans-serif` : undefined);
      engineRef.current = engine;
      if (!engine.ok) return;

      if (reduced) engine.renderStill();
      else sync();
    };

    const hasFontApi =
      typeof document !== "undefined" && "fonts" in document && !!document.fonts;
    const raf = requestAnimationFrame(() => {
      if (!hostRef.current) return;
      const fam = hasFontApi ? resolveFamily() : "";
      if (hasFontApi && fam) {
        const to = window.setTimeout(() => startEngine(fam), 350);
        const go = () => {
          window.clearTimeout(to);
          startEngine(fam);
        };
        document.fonts.load(`${FONT_WEIGHT} 1em "${fam}"`).then(go, go);
      } else {
        startEngine();
      }
    });

    const io = new IntersectionObserver(
      (es) => {
        onScreen = es[0]?.isIntersecting ?? false;
        sync();
      },
      { threshold: 0.2 },
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

    let rt = 0;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(() => engine?.resize(), 120);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      window.removeEventListener("resize", onResize);
      window.clearTimeout(rt);
      engine?.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setParams({
      word,
      threshold,
      cols,
      keyline,
      keylineOffset: [shadow, shadow],
      texture,
      separation,
      swim,
      pull,
      magnetReach,
    });
  }, [word, threshold, cols, keyline, shadow, texture, separation, swim, pull, magnetReach]);

  const remix = useCallback(() => {
    const next = (colorway + 1) % COLORWAYS.length;
    setColorway(next);
    engineRef.current?.setColorway(next);
  }, [colorway]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#9aa",
          }}
        >
          Playground
        </span>
        <button
          onClick={remix}
          style={{
            marginLeft: "auto",
            fontSize: 12,
            padding: "4px 12px",
            borderRadius: 999,
            border: "1px solid var(--border-line)",
            background: "transparent",
            color: "#eee",
            cursor: "pointer",
          }}
        >
          Remix
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div ref={hostRef} style={PREVIEW_STYLE} />

        <div style={PANEL_STYLE}>
          <label style={ROW_STYLE}>
            <span style={{ flexShrink: 0 }}>Word</span>
            <input
              value={word}
              onChange={(e) => setWord(e.target.value.slice(0, 14))}
              spellCheck={false}
              style={{
                minWidth: 0,
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                textAlign: "right",
                color: "#eee",
                fontSize: 12,
              }}
            />
          </label>

          <div style={ROW_STYLE}>
            <span>Colourway</span>
            <span style={{ marginLeft: "auto", color: "#eee" }}>
              {COLORWAYS[colorway].name}
            </span>
          </div>

          <Slider
            label="Threshold"
            value={threshold}
            min={0.25}
            max={0.85}
            step={0.005}
            onChange={setThreshold}
            format={(v) => v.toFixed(3)}
          />
          <Slider
            label="Grid"
            value={cols}
            min={40}
            max={260}
            step={2}
            format={(v) => `${Math.round(v)} cells`}
            onChange={setCols}
          />
          <Slider
            label="Keyline"
            value={keyline}
            min={0}
            max={8}
            step={1}
            format={(v) => `${Math.round(v)} cells`}
            onChange={setKeyline}
          />
          <Slider
            label="Shadow"
            value={shadow}
            min={0}
            max={6}
            step={1}
            format={(v) => `${Math.round(v)} cells`}
            onChange={setShadow}
          />
          <Slider
            label="Magnet"
            value={magnetReach}
            min={0}
            max={7}
            step={1}
            format={(v) => `${Math.round(v)} cells`}
            onChange={setMagnetReach}
          />
          <Slider
            label="Pull"
            value={pull}
            min={0}
            max={0.04}
            step={0.002}
            format={(v) => v.toFixed(3)}
            onChange={setPull}
          />
          <Slider
            label="Swim"
            value={swim}
            min={0}
            max={2.5}
            step={0.1}
            onChange={setSwim}
          />
          <Slider
            label="Separation"
            value={separation}
            min={0}
            max={3}
            step={0.1}
            onChange={setSeparation}
          />
          <Slider
            label="Texture"
            value={texture}
            min={0}
            max={1.6}
            step={0.02}
            format={(v) => v.toFixed(2)}
            onChange={setTexture}
          />
        </div>
      </div>
    </div>
  );
}

export default ArcadePlayground;
