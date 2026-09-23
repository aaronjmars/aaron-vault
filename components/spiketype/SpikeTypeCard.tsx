"use client";

import { useEffect, useRef } from "react";
import { traceWord, prepare, type Edge } from "./outline";
import { grow, type Spike } from "./spikes";
import { onTransitionChange } from "../../lib/view-transition";

const WORD = "mango";

const PALETTE = {

  ground: "#e4e4e8",

  mark: "#ffffff",
  line: "#ffc21e",
} as const;

const EVERY = 3;

const MAX_LEN = 0.26;

const ROOT = 0.006;

const ROUGH = 0.007;

const STEP = 0.006;

const LINE_W = 0.0032;

const RUN = 9;

const BREATH_RATE = 0.55;

const BREATH_AMT = 0.1;

const SWAY_AMT = 0.06;

const REPEL = 0.34;

const REACH_RATIO = 0.3;

const SPRING = 0.055;
const DAMP = 0.86;

const MAGNET = 0.012;

const MAGNET_REACH = 0.34;
const MAGNET_SPRING = 0.05;
const MAGNET_DAMP = 0.87;

const GROW_AMT = 0.9;

const HUE_FROM = 43.7;
const SAT_FROM = 100;
const LIT_FROM = 55.9;
const HUE_TO = 104;
const SAT_TO = 64;
const LIT_TO = 38;

const HUE_STEPS = 24;

const HUE_REACH = 0.22;

const HUE_RAMP: string[] = Array.from({ length: HUE_STEPS }, (_, i) => {
  const u = i / (HUE_STEPS - 1);

  const e = u * u * (3 - 2 * u);
  const hue = HUE_FROM + (HUE_TO - HUE_FROM) * e;
  const sat = SAT_FROM + (SAT_TO - SAT_FROM) * e;
  const lit = LIT_FROM + (LIT_TO - LIT_FROM) * e;
  return `hsl(${hue.toFixed(1)} ${sat.toFixed(1)}% ${lit.toFixed(1)}%)`;
});

export function SpikeTypeCard({ bare = false }: { bare?: boolean } = {}) {
  void bare;
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;

    const family = getComputedStyle(host).fontFamily || "sans-serif";

    let w = 0;
    let h = 0;
    let spikes: Spike[] = [];
    let edges: Edge[] = [];

    let widths: number[] = [];

    let ang: Float32Array = new Float32Array(0);
    let vel: Float32Array = new Float32Array(0);

    let ext: Float32Array = new Float32Array(0);
    let evel: Float32Array = new Float32Array(0);

    let letterCount = 0;
    let letterCx: number[] = [];

    let letterOf: number[] = [];
    let spikeLetter: number[] = [];
    let lmx = new Float32Array(0);
    let lmy = new Float32Array(0);
    let lvx = new Float32Array(0);
    let lvy = new Float32Array(0);
    let pointer: { x: number; y: number } | null = null;

    let px = 0;
    let py = 0;
    let grip = 0;

    let fresh = true;

    const build = () => {
      if (cancelled) return;
      w = host.clientWidth;
      h = host.clientHeight;
      if (!w || !h) return;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const { contours, field } = traceWord({ word: WORD, font: family, w, h, dpr });
      if (!contours.length) return;

      spikes = [];
      edges = [];

      const groups: { lo: number; hi: number; idx: number[] }[] = [];
      const spans = contours.map((c) => {
        let lo = Infinity;
        let hi = -Infinity;
        for (let i = 0; i < c.length; i += 2) {
          if (c[i] < lo) lo = c[i];
          if (c[i] > hi) hi = c[i];
        }
        return { lo, hi };
      });
      contours.forEach((_, i) => {
        const s = spans[i];
        const g = groups.find((q) => s.lo < q.hi && s.hi > q.lo);
        if (g) {
          g.lo = Math.min(g.lo, s.lo);
          g.hi = Math.max(g.hi, s.hi);
          g.idx.push(i);
        } else {
          groups.push({ lo: s.lo, hi: s.hi, idx: [i] });
        }
      });

      groups.sort((a, b) => a.lo - b.lo);

      letterOf = [];
      spikeLetter = [];
      contours.forEach((c, i) => {
        const e = prepare(c, h * STEP, h * ROUGH, i * 12.9);
        if (!e) return;
        const li = groups.findIndex((g) => g.idx.includes(i));
        edges.push(e);
        letterOf.push(li < 0 ? 0 : li);
        const before = spikes.length;
        spikes.push(
          ...grow(
            e,
            EVERY,
            { maxLen: h * MAX_LEN, root: h * ROOT, steps: 7, field },
            i * 53.1,
          ),
        );

        for (let k = before; k < spikes.length; k++) spikeLetter.push(li < 0 ? 0 : li);
      });

      letterCount = groups.length;

      letterCx = groups.map((g) => (g.lo + g.hi) / 2);
      lmx = new Float32Array(letterCount);
      lmy = new Float32Array(letterCount);
      lvx = new Float32Array(letterCount);
      lvy = new Float32Array(letterCount);

      const base = Math.max(1, h * LINE_W) * 2;
      const runs = Math.ceil(
        (spikes.reduce((a, s) => a + s.path.length / 2, 0) +
          edges.reduce((a, e) => a + e.pts.length / 2, 0)) /
          RUN,
      ) + 8;
      ang = new Float32Array(spikes.length);
      vel = new Float32Array(spikes.length);
      ext = new Float32Array(spikes.length);
      evel = new Float32Array(spikes.length);

      widths = new Array(runs);
      for (let i = 0; i < runs; i++) {
        const k = 1 + Math.sin(i * 0.37) * 0.34 + Math.sin(i * 0.13 + 2.1) * 0.22;
        widths[i] = base * Math.max(0.25, k);
      }

      draw(performance.now());
    };

    const draw = (now: number) => {
      if (!spikes.length || !w || !h) return;

      ctx.clearRect(0, 0, w, h);

      const t = now * 0.001;
      const reach = h * REACH_RATIO;
      const placed: number[][] = [];

      const pull = h * MAGNET;
      const span = h * MAGNET_REACH;
      for (let li = 0; li < letterCount; li++) {
        let gx = 0;
        let gy = 0;
        if (grip > 0.001) {
          const dx = px - letterCx[li];
          const dy = py - h / 2;
          const d = Math.hypot(dx, dy) || 1;
          const f = Math.max(0, 1 - d / span);

          const amt = pull * f * f * grip;
          gx = (dx / d) * amt;
          gy = (dy / d) * amt;
        }

        const mass = 1 + (li % 2) * 0.35;
        lvx[li] = (lvx[li] + (gx - lmx[li]) * (MAGNET_SPRING / mass)) * MAGNET_DAMP;
        lvy[li] = (lvy[li] + (gy - lmy[li]) * (MAGNET_SPRING / mass)) * MAGNET_DAMP;
        lmx[li] += lvx[li];
        lmy[li] += lvy[li];
      }

      const target = pointer ? 1 : 0;
      grip += (target - grip) * 0.12;
      if (pointer) {

        if (fresh) {
          px = pointer.x;
          py = pointer.y;
          fresh = false;
        } else {
          px += (pointer.x - px) * 0.18;
          py += (pointer.y - py) * 0.18;
        }
      }

      for (let si = 0; si < spikes.length; si++) {
        const sp = spikes[si];

        const sl = spikeLetter[si] ?? 0;
        const ox = lmx[sl] ?? 0;
        const oy = lmy[sl] ?? 0;

        const phase = t * BREATH_RATE + si * 0.7;
        const growK = 1 + Math.sin(phase) * BREATH_AMT;

        let turn = Math.sin(phase * 0.73 + 1.3) * SWAY_AMT;

        let goal = 0;
        if (grip > 0.001) {

          const dx = sp.x + ox - px;
          const dy = sp.y + oy - py;
          const d = Math.hypot(dx, dy);
          if (d < reach) {
            const f = 1 - d / reach;

            const side = Math.sign(sp.nx * dy - sp.ny * dx) || 1;
            goal = f * f * REPEL * side * (0.35 + sp.reach) * grip;
          }
        }

        const floppy = sp.reach;
        const k = SPRING * (1.7 - floppy * 1.2);
        const damp = DAMP - (1 - floppy) * 0.09;
        vel[si] = (vel[si] + (goal - ang[si]) * k) * damp;
        ang[si] += vel[si];
        turn += ang[si];

        let egoal = 0;
        if (grip > 0.001 && sp.slack > 0.01) {
          const dx2 = sp.x + ox - px;
          const dy2 = sp.y + oy - py;
          const d2 = Math.hypot(dx2, dy2);
          if (d2 < reach) {
            const f2 = 1 - d2 / reach;
            egoal = f2 * f2 * sp.slack * GROW_AMT * grip;
          }
        }
        evel[si] = (evel[si] + (egoal - ext[si]) * k * 1.3) * damp;
        ext[si] += evel[si];

        const c = Math.cos(turn);
        const s2 = Math.sin(turn);

        const ax = sp.nx * c - sp.ny * s2;
        const ay = sp.nx * s2 + sp.ny * c;

        const src = sp.path;
        const dst: number[] = new Array(src.length);
        for (let i = 0; i < src.length; i += 2) {

          const lx = src[i] * (growK + ext[si]);
          const ly = src[i + 1];

          dst[i] = sp.x + ox + ax * lx - ay * ly;
          dst[i + 1] = sp.y + oy + ay * lx + ax * ly;
        }
        placed.push(dst);
      }

      const subpaths: number[][] = placed;
      edges.forEach((e, ei) => {

        const li = letterOf[ei] ?? 0;
        const dx = lmx[li] ?? 0;
        const dy = lmy[li] ?? 0;
        const p = e.pts;
        const shifted: number[] = new Array(p.length);
        for (let i = 0; i < p.length; i += 2) {
          shifted[i] = p[i] + dx;
          shifted[i + 1] = p[i + 1] + dy;
        }
        subpaths.push(shifted);
      });

      ctx.beginPath();
      for (const p of subpaths) {
        ctx.moveTo(p[0], p[1]);
        for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
        ctx.closePath();
      }

      ctx.fillStyle = PALETTE.mark;
      ctx.fill("nonzero");

      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.strokeStyle = PALETTE.line;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      let wob = 0;

      const hueSpan = h * HUE_REACH;
      let lastStep = -1;
      ctx.strokeStyle = HUE_RAMP[0];

      for (const sub of subpaths) {
        const n = sub.length / 2;
        for (let a = 0; a < n; a += RUN) {

          ctx.lineWidth = widths[wob++ % widths.length];

          const rx = sub[(a % n) * 2];
          const ry = sub[(a % n) * 2 + 1];
          let step = 0;
          if (grip > 0.001) {
            const hd = Math.hypot(rx - px, ry - py);
            if (hd < hueSpan) {
              const f = 1 - hd / hueSpan;

              step = Math.round(f * f * grip * (HUE_STEPS - 1));
            }
          }
          if (step !== lastStep) {
            ctx.strokeStyle = HUE_RAMP[step];
            lastStep = step;
          }

          ctx.beginPath();
          ctx.moveTo(rx, ry);

          for (let b = 1; b <= RUN; b++) {
            const j = (a + b) % n;
            ctx.lineTo(sub[j * 2], sub[j * 2 + 1]);
          }
          ctx.stroke();
        }
      }

      ctx.fillStyle = PALETTE.ground;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    };

    const ready: Promise<unknown> = document.fonts?.ready ?? Promise.resolve();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let built = false;
    let raf = 0;
    let onScreen = false;
    let hidden = false;
    let inTransition = false;

    const running = () => built && onScreen && !hidden && !inTransition && !reduced;

    const frame = (now: number) => {
      raf = 0;
      if (!running()) return;
      draw(now);
      raf = requestAnimationFrame(frame);
    };

    const sync = () => {
      if (running()) {
        if (!raf) raf = requestAnimationFrame(frame);
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver(
      (es) => {
        onScreen = es.some((e) => e.isIntersecting);
        if (onScreen && !built) {
          built = true;
          ready.then(() => {
            build();

            sync();
          });
          return;
        }
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
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onEnter = (e: PointerEvent) => {
      fresh = true;
      onMove(e);
    };
    const onLeave = () => {
      pointer = null;
    };
    if (fine) {
      host.addEventListener("pointerenter", onEnter);
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
    }

    const ro = new ResizeObserver(() => {
      if (built) build();
    });
    ro.observe(host);

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      if (fine) {
        host.removeEventListener("pointerenter", onEnter);
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
      aria-label="The word mango knocked out in cream from a bright yellow ground, outlined in leaf green, its letters ragged and bristling with hundreds of fine hand-drawn spikes of wildly varying length; the spikes breathe slowly and bend away from the pointer"
      className="relative aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"
      style={{ background: PALETTE.ground }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

export default SpikeTypeCard;
