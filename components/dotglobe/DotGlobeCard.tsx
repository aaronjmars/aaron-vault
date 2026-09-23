"use client";

import { useEffect, useRef } from "react";
import { project } from "./sphere";
import { GRID, NAMES, lit } from "./glyphs";
import { onTransitionChange } from "../../lib/view-transition";

const GROUND = "#f4f4f4";

interface Duo {

  off: string;

  offNear: string;

  on: string;

  hot: string;
}

const DUOS: Duo[] = [

  { off: "#6e4b78", offNear: "#553260", on: "#b6f042", hot: "#d3f68e" },

  { off: "#4f8d96", offNear: "#33707a", on: "#f66751", hot: "#faaa9e" },

  { off: "#5f7ed6", offNear: "#3a5cc0", on: "#fadf2e", hot: "#fceb7e" },
];

const SPAN = (68.2 * Math.PI) / 180;

const COUNT = 3;

const RADIUS = 0.3;

const EXPS = [0.42, 0.66, 0.95];

const SCALES = [1, 1, 1];

const RECEDE = [0, 0, 0];

const GAP = 0.26;

const ROUND = 0.3;

const WOBBLE = (14 * Math.PI) / 180;

const WOBBLE_RATE = 0.7;

const TILT_MAX = 0.42;

const TILT_EASE = 0.06;

const LEAN_MAX = (2.5 * Math.PI) / 180;

const FIELD_RATIO = 0.3;

const LIFT = 0.16;

const OPEN = 0.035;

const TURN_EVERY_S = 26;

const TURN_S = 2.6;

const HOLD_S = 4.2;

const SWAP_S = 1.1;

const HANDOFF = 0.35;

const TRAIL = 0.22;

const TRAIL_REACH = 0.55;

const TRAIL_BANDS = 4;

export function DotGlobeCard({ bare = false }: { bare?: boolean } = {}) {
  void bare;
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let onScreen = false;
    let hidden = false;
    let inTransition = false;

    let tilt = 0;
    let tiltTarget = 0;

    let lean = 0;
    let leanTarget = 0;

    let ptr: { x: number; y: number } | null = null;
    let last = 0;

    let clock = 0;

    const resize = () => {
      w = host.clientWidth;
      h = host.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const roundQuad = (q: number[], k: number) => {
      let min = Infinity;
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        const d = Math.hypot(q[j * 2] - q[i * 2], q[j * 2 + 1] - q[i * 2 + 1]);
        if (d < min) min = d;
      }
      const r = min * k;
      if (r < 0.4) {

        ctx.moveTo(q[0], q[1]);
        for (let i = 1; i < 4; i++) ctx.lineTo(q[i * 2], q[i * 2 + 1]);
        ctx.closePath();
        return;
      }

      for (let i = 0; i < 4; i++) {
        const p = (i + 3) % 4;
        const n = (i + 1) % 4;
        const cx = q[i * 2];
        const cy = q[i * 2 + 1];

        const toP = edgePoint(cx, cy, q[p * 2], q[p * 2 + 1], r);
        const toN = edgePoint(cx, cy, q[n * 2], q[n * 2 + 1], r);

        if (i === 0) ctx.moveTo(toP[0], toP[1]);
        else ctx.lineTo(toP[0], toP[1]);

        ctx.quadraticCurveTo(cx, cy, toN[0], toN[1]);
      }
      ctx.closePath();
    };

    const draw = () => {
      if (!w || !h) return;

      ctx.clearRect(0, 0, w, h);

      const r = h * RADIUS;
      const FIELD = h * FIELD_RATIO;

      ctx.fillStyle = GROUND;
      ctx.fillRect(0, 0, w, h);

      for (let g = 0; g < COUNT; g++) {

        const base = DUOS[g % DUOS.length];
        const back = RECEDE[g % RECEDE.length];
        const duo: Duo = back
          ? {
              off: mix(base.off, GROUND, back),
              offNear: mix(base.offNear, GROUND, back),
              on: mix(base.on, GROUND, back),
              hot: mix(base.hot, GROUND, back),
            }
          : base;

        const cx = (w * (g + 0.5)) / COUNT;

        const leanG = ptr
          ? Math.max(-1, Math.min(1, (ptr.x - cx) / (w / COUNT))) * LEAN_MAX
          : 0;

        const slot = Math.floor(clock / TURN_EVERY_S);
        const intoSlot = clock % TURN_EVERY_S;
        const mine = slot % COUNT === g;

        const t = mine && intoSlot < TURN_S ? intoSlot / TURN_S : 0;
        const turn = t > 0 ? t * t * (3 - 2 * t) : 0;

        const shifted = clock - TURN_S * 0.5;
        const turnsDone =
          shifted < 0
            ? 0
            : Math.floor((Math.floor(shifted / TURN_EVERY_S) - g + COUNT) / COUNT);

        const spinG =
          Math.sin(clock * WOBBLE_RATE) * WOBBLE +
          lean * leanG +
          turn * Math.PI * 2;

        const tiltG = tilt + Math.sin(clock * 0.41) * WOBBLE * 0.28;

        const rg = r * SCALES[g % SCALES.length];

        const tiles = project({
          n: GRID,
          span: SPAN,
          r: rg,
          cx,
          cy: h / 2,
          spin: spinG,
          tilt: tiltG,
          gap: GAP,
          exp: EXPS[g % EXPS.length],
        });

        const cycle = HOLD_S + SWAP_S;
        const local = clock - g * SWAP_S * HANDOFF;
        const step = Math.floor(local / cycle);

        const raw = step - g + turnsDone;
        const idx = ((raw % NAMES.length) + NAMES.length) % NAMES.length;

        const into = (((local % cycle) + cycle) % cycle) - HOLD_S;
        const from = NAMES[idx];
        const to = NAMES[(idx + 1) % NAMES.length];

        const turning = turn > 0;
        const wave = turning ? 0 : into <= 0 ? 0 : into / SWAP_S;

        const mark = from;

        const isOn = (tl: (typeof tiles)[number]) => {
          if (wave <= 0) return lit(mark, tl.col, tl.row);
          if (wave >= 1) return lit(to, tl.col, tl.row);

          const ang = Math.acos(Math.max(-1, Math.min(1, tl.uz)));
          const d = ang / (Math.PI * 0.5);
          return d < wave ? lit(to, tl.col, tl.row) : lit(from, tl.col, tl.row);
        };

        const front = (tl: (typeof tiles)[number]) => {
          if (wave <= 0 || wave >= 1) return 0;
          const ang = Math.acos(Math.max(-1, Math.min(1, tl.uz)));
          const d = ang / (Math.PI * 0.5);

          const age = wave - d;
          if (age < 0 || age > TRAIL) return 0;
          const k = 1 - age / TRAIL;
          return k * k;
        };

        const push = (tl: (typeof tiles)[number]) => {
          if (!ptr || lean <= 0.002) return 0;
          const dx = tl.quad[0] - ptr.x;
          const dy = tl.quad[1] - ptr.y;
          const d = Math.hypot(dx, dy);
          if (d > FIELD) return 0;
          const k = 1 - d / FIELD;

          return k * k * lean;
        };

        const cell = (2 * SPAN * rg) / GRID;
        const moved = tiles.map((tl) => {
          const p = push(tl);
          if (p <= 0.01 || !ptr) return tl;
          const dx = tl.quad[0] - ptr.x;
          const dy = tl.quad[1] - ptr.y;
          const d = Math.hypot(dx, dy) || 1;
          const k = p * OPEN * cell;
          const ox = (dx / d) * k;
          const oy = (dy / d) * k;
          const q = tl.quad.slice();
          for (let i = 0; i < 4; i++) {
            q[i * 2] += ox;
            q[i * 2 + 1] += oy;
          }
          return { ...tl, quad: q };
        });

        ctx.beginPath();
        for (const tl of moved) {
          if (isOn(tl)) continue;

          roundQuad(tl.quad, ROUND);
        }
        ctx.fillStyle = duo.off;
        ctx.fill();

        ctx.beginPath();
        for (const tl of moved) {
          if (isOn(tl)) continue;
          if (tl.z < 0.55) continue;
          roundQuad(tl.quad, ROUND);
        }
        ctx.fillStyle = duo.offNear;
        ctx.fill();

        if (wave > 0 && wave < 1) {
          for (let b = 0; b < TRAIL_BANDS; b++) {
            const lo = b / TRAIL_BANDS;
            const hi = (b + 1) / TRAIL_BANDS;
            ctx.beginPath();
            let any = false;
            for (const tl of moved) {
              if (isOn(tl)) continue;
              const f = front(tl);
              if (f <= lo || f > hi) continue;
              roundQuad(tl.quad, ROUND);
              any = true;
            }
            if (!any) continue;

            ctx.fillStyle = mix(duo.offNear, duo.on, hi * TRAIL_REACH);
            ctx.fill();
          }
        }

        for (const tl of moved) {
          if (!isOn(tl)) continue;
          const p = Math.max(push(tl), front(tl));
          ctx.beginPath();
          if (p > 0.01) {

            const q = scaleQuad(tl.quad, 1 + p * LIFT);
            roundQuad(q, ROUND);
          } else {
            roundQuad(tl.quad, ROUND);
          }
          ctx.fillStyle = p > 0.01 ? duo.hot : duo.on;
          ctx.fill();
        }
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!running()) return;

      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      clock += dt;
      tilt += (tiltTarget - tilt) * TILT_EASE;

      lean += (leanTarget - lean) * (TILT_EASE * 0.7);

      draw();
      raf = requestAnimationFrame(frame);
    };

    const running = () => onScreen && !hidden && !inTransition && !reduced;

    const sync = () => {
      if (running()) {
        if (!raf) {
          last = 0;
          raf = requestAnimationFrame(frame);
        }
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    resize();
    draw();

    const io = new IntersectionObserver(
      (es) => {
        onScreen = es.some((e) => e.isIntersecting);
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

    const fine = window.matchMedia("(pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();

      const v = (e.clientY - r.top) / r.height - 0.5;
      tiltTarget = Math.max(-1, Math.min(1, v * 2)) * TILT_MAX;
      ptr = { x: e.clientX - r.left, y: e.clientY - r.top };
      leanTarget = 1;
    };
    const onLeave = () => {
      tiltTarget = 0;
      leanTarget = 0;

    };
    if (fine) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
    }

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(host);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      if (fine) {
        host.removeEventListener("pointermove", onMove);
        host.removeEventListener("pointerleave", onLeave);
      }
    };
  }, []);

  return (
    <div
      ref={hostRef}
      data-canvas-card
      role="img"
      aria-label="Three rounded-cube forms side by side on one grey ground, coloured lime on aubergine, coral on petrol teal, and acid yellow on cobalt. Each is tiled with a grid of rounded squares that crowd together and shrink toward the edges as the surface curves away, rocks gently on its own rhythm, and carries a bright symbol painted onto its surface. The marks pass along the row from left to right, each arriving as a bright wave spreading across the face, and now and then one form turns all the way round and comes back carrying the next mark. Moving the pointer leans the forms toward it and opens the tiles underneath."
      className="relative aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"
      style={{ background: GROUND }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

export default DotGlobeCard;

const RGB = new Map<string, [number, number, number]>();
const MIXED = new Map<string, string>();

function rgb(hex: string): [number, number, number] {
  const hit = RGB.get(hex);
  if (hit) return hit;
  const n = parseInt(hex.slice(1), 16);
  const v: [number, number, number] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  RGB.set(hex, v);
  return v;
}

function mix(a: string, b: string, k: number): string {
  const key = `${a}${b}${k.toFixed(3)}`;
  const hit = MIXED.get(key);
  if (hit) return hit;
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  const r = Math.round(ar + (br - ar) * k);
  const g = Math.round(ag + (bg - ag) * k);
  const bl = Math.round(ab + (bb - ab) * k);
  const out = `rgb(${r},${g},${bl})`;
  MIXED.set(key, out);
  return out;
}

function scaleQuad(q: number[], k: number): number[] {
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < 4; i++) {
    cx += q[i * 2];
    cy += q[i * 2 + 1];
  }
  cx /= 4;
  cy /= 4;
  const out: number[] = new Array(8);
  for (let i = 0; i < 4; i++) {
    out[i * 2] = cx + (q[i * 2] - cx) * k;
    out[i * 2 + 1] = cy + (q[i * 2 + 1] - cy) * k;
  }
  return out;
}

function edgePoint(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  d: number,
): [number, number] {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const t = Math.min(d / len, 0.5);
  return [ax + dx * t, ay + dy * t];
}
