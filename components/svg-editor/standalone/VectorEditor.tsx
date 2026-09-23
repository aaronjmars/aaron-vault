"use client";

import { useRef, type PointerEvent as RPointerEvent } from "react";
import type { Anchor, Vec, VectorPath } from "./types";
import { serializePath } from "./parse";
import { sub, add } from "./types";

export type Mirror = "none" | "angle" | "angle-length";

export interface EditorStyle {
  accent: string;
  arm: string;
  anchorR: number;
  handleR: number;
  pointFill: string;
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  showRig: boolean;
  fillRule: "nonzero" | "evenodd";
}

export const DEFAULT_EDITOR: EditorStyle = {
  accent: "#0d99ff",
  arm: "#9bb7d4",
  anchorR: 4,
  handleR: 3.2,
  pointFill: "#ffffff",
  fill: "#0d99ff",
  fillOpacity: 0.08,
  stroke: "#0d99ff",
  strokeWidth: 1.5,
  showRig: true,
  fillRule: "evenodd",
};

type Drag =
  | { kind: "anchor"; i: number }
  | { kind: "handle"; i: number; side: "in" | "out"; mirror: Mirror };

export function VectorEditor({
  path,
  onChange,
  style = DEFAULT_EDITOR,
  mirror = "angle-length",
  viewBox,
  width,
  height,
  className,
}: {
  path: VectorPath;
  onChange: (next: VectorPath) => void;
  style?: EditorStyle;

  mirror?: Mirror;

  viewBox: [number, number, number, number];

  width?: number;
  height?: number;
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);

  const pathRef = useRef(path);
  pathRef.current = path;
  const pending = useRef<Vec | null>(null);
  const rafMove = useRef(0);

  function toUser(e: { clientX: number; clientY: number }): Vec {
    const svg = svgRef.current!;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const u = pt.matrixTransform(ctm.inverse());
    return { x: u.x, y: u.y };
  }

  function startAnchor(e: RPointerEvent, i: number) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { kind: "anchor", i };
  }
  function startHandle(e: RPointerEvent, i: number, side: "in" | "out") {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);

    drag.current = { kind: "handle", i, side, mirror: e.altKey ? "none" : mirror };
  }

  function applyDrag(d: Drag, u: Vec): VectorPath {
    const anchors = pathRef.current.anchors.map((a) => ({
      p: { ...a.p },
      in: a.in ? { ...a.in } : null,
      out: a.out ? { ...a.out } : null,
    })) as Anchor[];

    if (d.kind === "anchor") {
      const a = anchors[d.i];
      const delta = sub(u, a.p);
      a.p = u;
      if (a.in) a.in = add(a.in, delta);
      if (a.out) a.out = add(a.out, delta);
    } else {
      const a = anchors[d.i];
      if (d.side === "out") a.out = u;
      else a.in = u;
      const other = d.side === "out" ? a.in : a.out;
      if (d.mirror !== "none" && other) {
        const rel = sub(u, a.p);
        const relLen = Math.hypot(rel.x, rel.y) || 1;
        const len =
          d.mirror === "angle-length" ? relLen : Math.hypot(other.x - a.p.x, other.y - a.p.y);
        const opp = { x: a.p.x - (rel.x / relLen) * len, y: a.p.y - (rel.y / relLen) * len };
        if (d.side === "out") a.in = opp;
        else a.out = opp;
      }
    }
    return { anchors, starts: pathRef.current.starts, closed: pathRef.current.closed };
  }

  function onMove(e: RPointerEvent) {
    if (!drag.current) return;
    pending.current = toUser(e);
    if (rafMove.current) return;
    rafMove.current = requestAnimationFrame(() => {
      rafMove.current = 0;
      const d = drag.current;
      const u = pending.current;
      if (!d || !u) return;
      onChange(applyDrag(d, u));
    });
  }

  function endDrag(e: RPointerEvent) {
    if (drag.current) {
      if (rafMove.current) {
        cancelAnimationFrame(rafMove.current);
        rafMove.current = 0;
        const u = pending.current;
        if (u) onChange(applyDrag(drag.current, u));
      }
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      drag.current = null;
      pending.current = null;
    }
  }

  const s = style;
  const d = serializePath(path);

  const arms: { ax: number; ay: number; hx: number; hy: number }[] = [];
  if (s.showRig) {
    for (const a of path.anchors) {
      if (a.out) arms.push({ ax: a.p.x, ay: a.p.y, hx: a.out.x, hy: a.out.y });
      if (a.in) arms.push({ ax: a.p.x, ay: a.p.y, hx: a.in.x, hy: a.in.y });
    }
  }

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox.join(" ")}
      width={width ?? viewBox[2]}
      height={height ?? viewBox[3]}
      className={className}
      style={{ display: "block", touchAction: "none", userSelect: "none", overflow: "visible" }}
      onPointerMove={onMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {}
      <path d={d} fill={s.fill} fillRule={s.fillRule} fillOpacity={s.fillOpacity} stroke={s.stroke} strokeWidth={s.strokeWidth} />

      {s.showRig && (
        <g>
          {}
          <g stroke={s.arm} strokeWidth={Math.max(0.75, s.strokeWidth * 0.6)}>
            {arms.map((a, k) => (
              <line key={k} x1={a.ax} y1={a.ay} x2={a.hx} y2={a.hy} />
            ))}
          </g>

          {/* bezier handles (diamonds) */}
          {path.anchors.map((a, i) => (
            <g key={`h-${i}`}>
              {a.out && (
                <Diamond
                  cx={a.out.x}
                  cy={a.out.y}
                  r={s.handleR}
                  fill={s.pointFill}
                  stroke={s.accent}
                  onPointerDown={(e) => startHandle(e, i, "out")}
                />
              )}
              {a.in && (
                <Diamond
                  cx={a.in.x}
                  cy={a.in.y}
                  r={s.handleR}
                  fill={s.pointFill}
                  stroke={s.accent}
                  onPointerDown={(e) => startHandle(e, i, "in")}
                />
              )}
            </g>
          ))}

          {/* anchors on top so they win the hit-test */}
          {path.anchors.map((a, i) => (
            <g key={`a-${i}`} style={{ cursor: "grab" }} onPointerDown={(e) => startAnchor(e, i)}>
              {/* fat invisible hit target */}
              <circle cx={a.p.x} cy={a.p.y} r={s.anchorR * 3} fill="transparent" />
              <circle cx={a.p.x} cy={a.p.y} r={s.anchorR} fill={s.pointFill} stroke={s.accent} strokeWidth={1.25} />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

function Diamond({
  cx,
  cy,
  r,
  fill,
  stroke,
  onPointerDown,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke: string;
  onPointerDown: (e: RPointerEvent) => void;
}) {
  return (
    <g style={{ cursor: "grab" }} onPointerDown={onPointerDown}>
      <circle cx={cx} cy={cy} r={r * 3.5} fill="transparent" />
      <rect
        x={cx - r}
        y={cy - r}
        width={r * 2}
        height={r * 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.1}
        style={{ transform: "rotate(45deg)", transformOrigin: "50% 50%", transformBox: "fill-box" }}
      />
    </g>
  );
}
