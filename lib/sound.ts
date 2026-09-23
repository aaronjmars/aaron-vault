let ctx: AudioContext | null = null;
let unlocked = false;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!unlocked) return null; // only after a user gesture
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

if (typeof window !== "undefined") {
  const unlock = () => {
    unlocked = true;
    window.removeEventListener("pointerdown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
}

export function cutTick() {
  const ac = ensure();
  if (!ac) return;
  try {
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "square";
    osc.frequency.value = 180;
    gain.gain.setValueAtTime(0.02, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  } catch {
    /* ignore */
  }
}

export function glitchTick() {
  const ac = ensure();
  if (!ac) return;
  try {
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(900 + Math.random() * 600, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);
    gain.gain.setValueAtTime(0.012, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  } catch {
    /* ignore */
  }
}

export function glitchScan(dur = 2.6) {
  const ac = ensure();
  if (!ac) return;
  try {
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(70, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + Math.min(dur, 3));
    gain.gain.setValueAtTime(0.015, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(dur, 3));
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + Math.min(dur, 3) + 0.05);
  } catch {
    /* ignore */
  }
}

export type ButtonSound = "soft" | "crisp" | "thock";

export function buttonHover(kind: ButtonSound = "soft") {
  const ac = ensure();
  if (!ac) return;
  try {
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    const f = kind === "crisp" ? 720 : kind === "thock" ? 320 : 520;
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 0.8, t + 0.05);
    gain.gain.setValueAtTime(0.008, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  } catch {
    /* ignore */
  }
}

export function buttonClick(kind: ButtonSound = "soft") {
  const ac = ensure();
  if (!ac) return;
  try {
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = kind === "thock" ? "sine" : "triangle";
    const f = kind === "crisp" ? 900 : kind === "thock" ? 240 : 620;
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.07);
    gain.gain.setValueAtTime(0.02, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  } catch {
    /* ignore */
  }
}
