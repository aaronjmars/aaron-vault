"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EmbossPlayground } from "./pg-engine";
import { defaultParams, remixParams, type EmbossParams } from "./params";
import { BUILTIN_SVGS, type Content } from "./content-mask";
import {
  PG_PREVIEW, PG_PANEL, Slider, ColorControl, GhostButton, SegmentedControl, Select,
} from "../swirl/controls";
import { SectionLabel } from "../section-label";
import { hapticTap } from "../../lib/haptics";

const LABEL = "text-[12px] text-[var(--text-tertiary)]";

const toHex = (c: [number, number, number]) =>
  "#" + c.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
const fromHex = (h: string): [number, number, number] => {
  const n = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2) || "0", 16) / 255) as [number, number, number];
};

export function EmbossPlayground_() {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<EmbossPlayground | null>(null);

  const [params, setParams] = useState<EmbossParams>(() => defaultParams());
  const [mode, setMode] = useState<"text" | "image">("text");
  const [word, setWord] = useState("emboss");
  const [shapeId, setShapeId] = useState(BUILTIN_SVGS[0].id);
  const [svg, setSvg] = useState<string | null>(BUILTIN_SVGS[0].svg);
  const fileRef = useRef<HTMLInputElement>(null);

  const content: Content = useMemo(
    () => (mode === "text" ? { word, svg: null } : { word: "", svg }),
    [mode, word, svg],
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let raf = 0;
    let started = false;
    const build = () => {
      if (started) return;
      started = true;
      raf = requestAnimationFrame(() => {
        const eng = new EmbossPlayground(host, params, content);
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

  useEffect(() => { engineRef.current?.setParams(params); }, [params]);
  useEffect(() => { engineRef.current?.setContent(content); }, [content]);

  const patch = (p: Partial<EmbossParams>) => setParams((prev) => ({ ...prev, ...p }));

  const remix = () => {
    hapticTap();
    setParams(remixParams());
  };

  const shapeOptions = [
    ...BUILTIN_SVGS.map((s) => ({ id: s.id, label: s.name })),
    { id: "upload", label: "Upload SVG..." },
  ];
  const pickShape = (id: string) => {
    if (id === "upload") {
      fileRef.current?.click();
      return;
    }
    const s = BUILTIN_SVGS.find((b) => b.id === id);
    if (s) { setShapeId(id); setSvg(s.svg); }
  };
  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      hapticTap();
      setShapeId("upload");
      setSvg(String(reader.result || ""));
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <SectionLabel
        action={<GhostButton onClick={remix}>Remix</GhostButton>}
      >
        Playground
      </SectionLabel>

      {/* the plate */}
      <div className={`${PG_PREVIEW} aspect-[1344/620] w-full`}>
        <div ref={hostRef} data-canvas-card className="absolute inset-0 h-full w-full" />
      </div>

      {/* controls */}
      <div className={PG_PANEL}>
        {/* content picker */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className={`${LABEL} shrink-0`}>Content</span>
          <div className="flex items-center gap-2 sm:ml-auto">
            <div className="w-[130px] shrink-0 sm:w-[140px]">
              <SegmentedControl
                activeId={mode}
                onPick={(id) => setMode(id as "text" | "image")}
                options={[
                  { id: "text", label: "Text" },
                  { id: "image", label: "Image" },
                ]}
              />
            </div>
            {mode === "text" ? (
              <input
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="type a word"
                maxLength={16}
                className="h-8 min-w-0 flex-1 rounded-lg border border-[var(--border-line)] bg-[var(--bg-page)] px-3 text-[12px] text-[var(--text-primary)] outline-none transition-colors duration-150 ease-[var(--ease-out)] placeholder:text-[var(--text-tertiary)] hover:border-[var(--border-ring)] focus:border-[var(--border-ring)] sm:w-[150px] sm:flex-none"
              />
            ) : (
              <div className="min-w-0 flex-1 sm:w-[150px] sm:flex-none">
                <Select
                  activeId={shapeId}
                  onPick={pickShape}
                  options={shapeOptions}
                  ariaLabel="Shape"
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept=".svg,image/svg+xml"
                  onChange={onUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* three columns: Bevel | Light | Surface */}
        <div className="grid grid-cols-1 items-start gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="flex flex-col gap-3 self-start">
            <span className={LABEL}>Bevel</span>
            <Slider label="Depth" value={params.depth} min={0.2} max={2} step={0.01}
              format={(v) => v.toFixed(2)} onChange={(v) => patch({ depth: v })} />
            <Slider label="Size" value={params.size} min={1} max={24} step={0.5}
              format={(v) => `${v.toFixed(1)}px`} onChange={(v) => patch({ size: v })} />
            <Slider label="Soften" value={params.soften} min={0} max={12} step={0.5}
              format={(v) => `${v.toFixed(1)}px`} onChange={(v) => patch({ soften: v })} />
          </div>

          <div className="flex flex-col gap-3">
            <span className={LABEL}>Light</span>
            <Slider label="Angle" value={params.angle} min={0} max={360} step={1}
              format={(v) => `${v | 0}°`} onChange={(v) => patch({ angle: v })} />
            <Slider label="Altitude" value={params.altitude} min={0} max={90} step={1}
              format={(v) => `${v | 0}°`} onChange={(v) => patch({ altitude: v })} />
            <Slider label="Highlight" value={params.highlight} min={0} max={0.6} step={0.01}
              format={(v) => `${(v * 100) | 0}%`} onChange={(v) => patch({ highlight: v })} />
            <Slider label="Shadow" value={params.shadow} min={0} max={0.6} step={0.01}
              format={(v) => `${(v * 100) | 0}%`} onChange={(v) => patch({ shadow: v })} />
          </div>

          <div className="flex flex-col gap-3 sm:col-span-2">
            <span className={LABEL}>Surface</span>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Slider label="Brightness" value={params.bright} min={0.8} max={2.4} step={0.01}
                format={(v) => v.toFixed(2)} onChange={(v) => patch({ bright: v })} />
              <Slider label="Grain" value={params.contrast} min={0} max={1.4} step={0.01}
                format={(v) => v.toFixed(2)} onChange={(v) => patch({ contrast: v })} />
              <Slider label="Texture zoom" value={params.texScale} min={0.4} max={2.4} step={0.01}
                format={(v) => `${v.toFixed(2)}×`} onChange={(v) => patch({ texScale: v })} />
              <ColorControl
                label="Tint"
                value={toHex(params.tint)}
                onChange={(hex) => patch({ tint: fromHex(hex) })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmbossPlayground_;
