import { FRAGMENTS, drawMatching, makeBag, type Fragment } from "./fragments";
import { PAIRS, UNDERLINE_EVERY, makeStepper } from "./palette";

export interface Vec {
  x: number;
  y: number;
}

export interface Badge {
  text: string;
  bg: string;
  fg: string;
  underline: boolean;
  comment: boolean;

  hot: boolean;
}

export interface Row {
  id: number;
  badges: Badge[];

  anchorIndex: number;

  pos: Vec;

  slot: number;
}

export const ROWS = 22;

export const FONT_RATIO = 1 / 42;

export const LINE_RATIO = 1.24;

export const PAD_RATIO = 0.12;

export const STEP_RATIO = 1.4;

export const MAX_BADGES = 3;

const CHASE = 0.24;

export function chaseRate(): number {
  return CHASE;
}

export function badgeCount(index: number, total: number): number {
  void total;
  if (index === 0) return 1;
  if (index === 1) return 2;
  return MAX_BADGES;
}

export function presence(index: number, total: number): number {
  const t = total <= 1 ? 0 : index / (total - 1);

  const START = 0.62;
  const fade = 1 - Math.max(0, (t - START) / (1 - START)) ** 1.6;
  return Math.max(0, Math.min(1, fade));
}

const HOT_EVERY = 19;
const HOT_COLORS = [
  { bg: "#0B0B0B", fg: "#F5F5F5" },
  { bg: "#FFFFFF", fg: "#111111" },
];

export function makeRowFactory() {
  const nextFragment = makeBag(FRAGMENTS);
  const nextPair = makeStepper(PAIRS.length);
  let id = 0;
  let sinceUnderline = 0;
  let sinceHot = 0;

  const paint = (text: string, comment: boolean): Badge => {
    const pair = PAIRS[nextPair()];
    sinceUnderline++;
    sinceHot++;
    const underline =
      pair.underline === true || sinceUnderline >= UNDERLINE_EVERY;
    if (underline) sinceUnderline = 0;
    const hot = sinceHot >= HOT_EVERY;
    if (hot) sinceHot = 0;
    const shock = HOT_COLORS[id % HOT_COLORS.length];
    return {
      text,
      bg: hot ? shock.bg : pair.bg,
      fg: hot ? shock.fg : pair.fg,
      underline,
      comment,
      hot,
    };
  };

  return function buildRow(): Row {
    const badges: Badge[] = [];

    let need: Fragment["in"] = "free";
    for (let i = 0; i < MAX_BADGES; i++) {
      const f: Fragment =
        i === 0 ? nextFragment() : drawMatching(nextFragment, need);
      badges.push(paint(f.text, f.comment === true));
      need = f.out === "end" ? "free" : f.out;

      if (f.comment) break;
    }

    return {
      id: id++,
      badges,

      anchorIndex: badges.length,
      pos: { x: 0, y: 0 },
      slot: 0,
    };
  };
}

export class Drift {
  private at: Vec = { x: 0, y: 0 };

  private dir: Vec = { x: 1, y: 0 };
  private target: Vec = { x: 0, y: 0 };
  private started = false;

  // px per ms at SPEED_REF_W wide; scaled with the card so a small card
  // does not whip the head (and the trail) across itself
  private static readonly SPEED = 0.34;
  private static readonly SPEED_REF_W = 1000;
  private speed = Drift.SPEED;

  private turn = 0.0042;

  constructor(
    private w: number,
    private h: number,
  ) {
    this.resize(w, h);
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.speed = Drift.SPEED * Math.min(1, w / Drift.SPEED_REF_W);
  }

  reseed(at: Vec) {
    this.at = { ...at };
    this.started = true;
    this.retarget();
  }

  // The staircase hangs down and to the left of the head, so the head
  // wanders the upper right of the card to keep the trail in frame.
  private static readonly BOX = { x0: 0.64, x1: 0.92, y0: 0.12, y1: 0.44 };

  private retarget() {
    const b = Drift.BOX;
    this.target = {
      x: (b.x0 + Math.random() * (b.x1 - b.x0)) * this.w,
      y: (b.y0 + Math.random() * (b.y1 - b.y0)) * this.h,
    };
  }

  step(dt: number): Vec {
    const b = Drift.BOX;
    if (!this.started) {
      this.at = { x: this.w * ((b.x0 + b.x1) / 2), y: this.h * ((b.y0 + b.y1) / 2) };
      this.started = true;
      this.retarget();
    }

    const bx = this.target.x - this.at.x;
    const by = this.target.y - this.at.y;
    const bl = Math.hypot(bx, by) || 1;
    const k = Math.min(1, this.turn * dt);
    this.dir.x += (bx / bl - this.dir.x) * k;
    this.dir.y += (by / bl - this.dir.y) * k;
    const dl = Math.hypot(this.dir.x, this.dir.y) || 1;
    this.dir.x /= dl;
    this.dir.y /= dl;

    this.at.x += this.dir.x * this.speed * dt;
    this.at.y += this.dir.y * this.speed * dt;

    if (bl < Math.min(this.w, this.h) * 0.22) this.retarget();

    const near =
      this.at.x < this.w * b.x0 ||
      this.at.x > this.w * b.x1 ||
      this.at.y < this.h * b.y0 ||
      this.at.y > this.h * b.y1;
    if (near) {
      this.target = { x: this.w * ((b.x0 + b.x1) / 2), y: this.h * ((b.y0 + b.y1) / 2) };
    }

    // small slack past the box so the turn back reads as a curve, not a wall
    this.at.x = Math.max(this.w * (b.x0 - 0.06), Math.min(this.w * (b.x1 + 0.04), this.at.x));
    this.at.y = Math.max(this.h * (b.y0 - 0.06), Math.min(this.h * (b.y1 + 0.06), this.at.y));

    return { ...this.at };
  }
}
