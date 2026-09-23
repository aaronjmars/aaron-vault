import {
  BORDER,
  CENTER_COLUMN,
  FLOWER_R,
  FPS,
  INK,
  MARGIN,
  PAPER,
  PITCH,
  ROWS,
  TICKS,
  TRAVEL_PER_LOOP,
} from "./params";
import { POSES } from "./flipbook";

function keepFlower(rings: number[][]): number[][] {
  return rings.filter((r) => {
    const n = r.length / 2;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < r.length; i += 2) {
      cx += r[i];
      cy += r[i + 1];
    }
    return Math.hypot(cx / n, cy / n) < 0.5;
  });
}

export class FlowerLattice {
  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private t0 = 0;
  private running = false;
  private dpr = 1;
  private lastTick = -1;

  private poses: Path2D[];

  readonly ok: boolean;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d");
    this.ok = !!this.ctx;
    this.poses = POSES.map((rings) => {
      const p = new Path2D();
      for (const r of keepFlower(rings)) {
        p.moveTo(r[0], r[1]);
        for (let i = 2; i < r.length; i += 2) p.lineTo(r[i], r[i + 1]);
        p.closePath();
      }
      return p;
    });
    if (this.ok) this.resize();
  }

  resize() {
    const c = this.canvas;
    const r = c.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(r.width * this.dpr);
    c.height = Math.round(r.height * this.dpr);
    this.lastTick = -1;
    if (!this.running) this.renderStill();
  }

  start() {
    if (this.running || !this.ok) return;
    this.running = true;
    this.t0 = performance.now();
    this.lastTick = -1;
    const tick = (now: number) => {
      if (!this.running) return;
      const t = Math.floor((Math.max(0, now - this.t0) / 1000) * FPS) % TICKS;

      if (t !== this.lastTick) {
        this.lastTick = t;
        this.draw(t);
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  renderStill() {
    if (this.ok) this.draw(0);
  }

  destroy() {
    this.stop();
    this.ctx = null;
  }

  private draw(tick: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const { dpr } = this;
    const W = this.canvas.width / dpr;
    const H = this.canvas.height / dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);

    const margin = MARGIN * H;
    const border = BORDER * H;
    const inset = margin + border;
    // Snap the pitch so an odd count of whole flowers spans the framed width
    // (centre column included), capped so a flower never outgrows the height.
    const inner = W - inset * 2;
    const count = Math.max(1, 2 * Math.round((inner / (PITCH * H) - 1) / 2) + 1);
    const pitch = Math.min(inner / count, (H / 2 - inset) / FLOWER_R);

    ctx.save();
    ctx.beginPath();
    ctx.rect(inset, inset, W - inset * 2, H - inset * 2);
    ctx.clip();

    const pose = this.poses[tick % this.poses.length];
    const travel = (TRAVEL_PER_LOOP * tick * pitch) / TICKS;
    const reach = FLOWER_R * pitch;
    const base = CENTER_COLUMN ? W / 2 : pitch / 3;

    ctx.fillStyle = INK;
    for (let r = 0; r < ROWS.length; r++) {
      const cy = ROWS[r] * H;

      const drift = r === 0 ? -travel : r === ROWS.length - 1 ? travel : 0;

      const start = ((base + drift) % pitch + pitch) % pitch - pitch;
      for (let x = start; x < W + reach; x += pitch) {
        if (x < -reach) continue;
        ctx.save();
        ctx.translate(x, cy);
        ctx.scale(pitch, pitch);
        ctx.fill(pose, "evenodd");
        ctx.restore();
      }
    }
    ctx.restore();

    ctx.beginPath();
    ctx.rect(margin, margin, W - margin * 2, H - margin * 2);
    ctx.rect(inset, inset, W - inset * 2, H - inset * 2);
    ctx.fillStyle = INK;
    ctx.fill("evenodd");
  }
}
