import { type Brush, type Ink, INK, inkColor } from "./brushes";

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export interface PathPoint {
  x: number;
  y: number;

  t: number;

  v: number;
}

export function spiralPath(
  cx: number,
  cy: number,
  rMax: number,
  turns = 2.15,
  steps = 900,
): PathPoint[] {
  const pts: PathPoint[] = [];
  const a0 = -Math.PI * 0.55;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    const r = rMax * Math.pow(t, 0.72);
    const a = a0 + t * turns * Math.PI * 2;

    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, t, v: Math.pow(t, 0.6) });
  }
  return pts;
}

export function trailPath(raw: { x: number; y: number }[]): PathPoint[] {
  if (raw.length < 2) return [];
  const out: PathPoint[] = [];
  let total = 0;
  const seg: number[] = [0];
  for (let i = 1; i < raw.length; i++) {
    total += Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y);
    seg.push(total);
  }
  if (total <= 0) return [];
  for (let i = 0; i < raw.length; i++) {
    const prev = raw[Math.max(0, i - 1)];
    const next = raw[Math.min(raw.length - 1, i + 1)];
    const d = Math.hypot(next.x - prev.x, next.y - prev.y);
    out.push({
      x: raw[i].x,
      y: raw[i].y,
      t: seg[i] / total,

      v: Math.min(1, d / 24),
    });
  }
  return out;
}

export interface StrokeOptions {

  progress?: number;

  sizePx?: number;

  hue?: number;

  dpr?: number;

  ink?: Ink;

  alpha?: number;

  from?: number;
}

export function stroke(
  ctx: CanvasRenderingContext2D,
  path: PathPoint[],
  brush: Brush,
  shortSide: number,
  opts: StrokeOptions = {},
) {
  if (path.length < 2) return;
  const dpr = opts.dpr ?? 1;
  const progress = opts.progress ?? 1;
  if (progress <= 0) return;
  const ink = opts.ink ?? INK;
  const alphaMul = opts.alpha ?? 1;
  if (alphaMul <= 0) return;
  const from = opts.from ?? 0;

  const base = Math.max(1, Math.round((opts.sizePx ?? brush.size * shortSide) * dpr));

  const step = Math.max(1, base * Math.max(0.02, brush.spacing));

  let carry = 0;
  let idx = 0;
  const limit = progress;

  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (a.t > limit) break;

    const dx = (b.x - a.x) * dpr;
    const dy = (b.y - a.y) * dpr;
    const segLen = Math.hypot(dx, dy);
    if (segLen <= 0) continue;
    const ux = dx / segLen;
    const uy = dy / segLen;
    const ang = Math.atan2(uy, ux);

    let travelled = carry;
    while (travelled < segLen) {
      const f = travelled / segLen;
      const t = a.t + (b.t - a.t) * f;
      if (t > limit) break;

      if (t < from) {
        idx++;
        travelled += step;
        continue;
      }

      const v = a.v + (b.v - a.v) * f;
      let px = (a.x * dpr + dx * f);
      let py = (a.y * dpr + dy * f);

      const h1 = hash(idx * 2.17);
      const h2 = hash(idx * 3.71 + 11.3);
      const h3 = hash(idx * 5.13 + 27.9);

      if (brush.jitter > 0) {
        const j = (h1 - 0.5) * 2 * brush.jitter * base;
        px += -uy * j;
        py += ux * j;
      }

      if (brush.scatter > 0) {
        const sa = h2 * Math.PI * 2;
        const sr = h3 * brush.scatter * base;
        px += Math.cos(sa) * sr;
        py += Math.sin(sa) * sr;
      }

      const scale = brush.speedSize > 0 ? 1 - brush.speedSize * v * 0.55 : 1;
      const cell = Math.max(1, Math.round(base * scale * 0.5));

      const rot = brush.follow > 0 ? ang * brush.follow : 0;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const hue = brush.hueDrift * t + (opts.hue ?? 0);

      for (const c of brush.cells) {

        const ox = c.x * base * 0.5;
        const oy = c.y * base * 0.5;
        const rx = ox * cos - oy * sin;
        const ry = ox * sin + oy * cos;
        const w = Math.max(1, Math.round(cell * c.s));

        const x = Math.floor(px + rx - w / 2);
        const y = Math.floor(py + ry - w / 2);
        ctx.fillStyle = inkColor(ink, hue, c.a * alphaMul);
        ctx.fillRect(x, y, w, w);
      }

      idx++;
      travelled += step;
    }
    carry = travelled - segLen;
  }
}
