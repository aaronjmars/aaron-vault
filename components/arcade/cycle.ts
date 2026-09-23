/**
 * Auto-cycle state machine for the arcade playground: hold at full grid,
 * melt the resolution down, then collapse to the minimum before the word
 * advances (the engine advances the word when the previous phase was
 * "collapse").
 */

export type Phase = "hold" | "melt" | "collapse";

export const SEQUENCE = ["arcade", "pixel", "signal", "mosh", "neon"];

const ORDER: Phase[] = ["hold", "melt", "collapse"];

const DURATION: Record<Phase, number> = {
  hold: 2400,
  melt: 900,
  collapse: 420,
};

const COLS_FULL = 150;
const COLS_MIN = 26;

export function phaseMs(p: Phase): number {
  return DURATION[p];
}

export function nextPhase(p: Phase): Phase {
  return ORDER[(ORDER.indexOf(p) + 1) % ORDER.length];
}

export function cellsAt(p: Phase, t: number): number {
  const k = Math.max(0, Math.min(1, t));
  if (p === "hold") return COLS_FULL;
  if (p === "melt") return Math.round(COLS_FULL - (COLS_FULL - 60) * k);
  return Math.round(60 - (60 - COLS_MIN) * k);
}
