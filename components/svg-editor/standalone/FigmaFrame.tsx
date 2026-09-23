"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export interface FrameStyle {
  accent: string;
  handleSize: number;
  handleFill: string;
  borderWidth: number;
  showHandles: boolean;
  showBadge: boolean;
  badgeBg: string;
  badgeText: string;

  animateKey?: string | number;
}

export const DEFAULT_FRAME: FrameStyle = {
  accent: "#0d99ff",
  handleSize: 8,
  handleFill: "#ffffff",
  borderWidth: 1,
  showHandles: true,
  showBadge: true,
  badgeBg: "#0d99ff",
  badgeText: "#ffffff",
};

export function FigmaFrame({
  children,
  style = DEFAULT_FRAME,

  width,
  height,
}: {
  children: ReactNode;
  style?: FrameStyle;
  width?: number;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const [firstMount, setFirstMount] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setFirstMount(false), 900);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (width != null && height != null) {
      setSize({ w: width, h: height });
      return;
    }
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      // layout size, so a scaled-down parent does not change the readout
      setSize({ w: el.offsetWidth, h: el.offsetHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  const w = width ?? size.w;
  const h = height ?? size.h;

  const s = style;
  const half = s.handleSize / 2;
  const handle = (pos: CSSProperties, intro: boolean, delay: number): CSSProperties => ({
    position: "absolute",
    zIndex: 10,
    width: s.handleSize,
    height: s.handleSize,
    backgroundColor: s.handleFill,
    border: `1px solid ${s.accent}`,
    borderRadius: 1,

    ...(intro ? { animation: `bbox-handle 0.25s ease-out both`, animationDelay: `${delay}s` } : {}),
    ...pos,
  });

  const intro = firstMount;

  return (
    <div ref={ref} className="relative inline-block">
      {}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          border: `${s.borderWidth}px solid ${s.accent}`,
          transformOrigin: "top left",
          animation: intro ? `bbox-open 0.6s var(--ease-expo) both` : undefined,
        }}
      />

      {s.showHandles && (
        <>
          <span style={handle({ top: -half, left: -half }, intro, 0.18)} />
          <span style={handle({ top: -half, right: -half }, intro, 0.28)} />
          <span style={handle({ bottom: -half, right: -half }, intro, 0.38)} />
          <span style={handle({ bottom: -half, left: -half }, intro, 0.48)} />
        </>
      )}

      {s.showBadge && (
        <span
          className="pointer-events-none absolute left-1/2 z-10 whitespace-nowrap rounded-[4px] px-2 py-0.5 text-[11px] tabular-nums"
          style={{
            bottom: -30,
            backgroundColor: s.badgeBg,
            color: s.badgeText,
            transform: "translateX(-50%)",
            ...(intro ? { animation: `bbox-badge 0.25s ease-out both`, animationDelay: "0.2s" } : {}),
          }}
        >
          {w} × {h}
        </span>
      )}

      {children}
    </div>
  );
}
