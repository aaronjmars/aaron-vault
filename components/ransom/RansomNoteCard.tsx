"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RansomLine } from "./RansomLine";
import { useMagnetism } from "./use-magnetism";
import { composeLine, hashSeed, lineWidth, DEFAULT_JITTER, type Placed } from "./manifest";
import { onTransitionChange } from "../../lib/view-transition";

const PHRASES = ["stay weird", "make stuff", "be kind", "trust me", "keep going", "no rules"];

const REVEAL_HOLD = 1800;
const CROSS_OVERLAP = 150;
const OUT_MS = 260;

type Slot = { key: number; phraseIdx: number; placed: Placed[]; direction: "in" | "out"; revealed: boolean };

export function RansomNoteCard({
  bare = false,
  viewTransitionName,
}: {
  bare?: boolean;
  viewTransitionName?: string;
} = {}) {
  void bare;
  const hostRef = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(900);

  const seq = useRef(1);
  const makeSlot = (phraseIdx: number): Slot => ({
    key: seq.current++,
    phraseIdx,
    placed: composeLine(PHRASES[phraseIdx].toUpperCase(), hashSeed(PHRASES[phraseIdx]), DEFAULT_JITTER),
    direction: "in",
    revealed: false,
  });

  const [slots, setSlots] = useState<Slot[]>(() => [
    {
      key: 0,
      phraseIdx: 0,
      placed: composeLine(PHRASES[0].toUpperCase(), hashSeed(PHRASES[0]), DEFAULT_JITTER),
      direction: "in",
      revealed: false,
    },
  ]);

  const current = slots[slots.length - 1];
  const lineH = useMemo(() => {
    const usable = avail * 0.86;
    const target = Math.max(34, Math.min(80, Math.round(avail * 0.062)));
    const natural = lineWidth(current.placed, target);
    return natural > usable ? Math.max(30, Math.floor((target * usable) / natural)) : target;
  }, [current.placed, avail]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ro = new ResizeObserver(() => setAvail(host.clientWidth));
    ro.observe(host);

    if (reduced) {
      // static: just show the first phrase resolved
      const raf = requestAnimationFrame(() =>
        setSlots((s) => [{ ...s[s.length - 1], revealed: true }]),
      );
      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
      };
    }

    let onScreen = false;
    let hidden = false;
    let hovering = false;
    let inTransition = false;
    let running = false;
    const timers = new Set<number>();
    const after = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    };
    const clearTimers = () => {
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
    };

    const revealCurrent = () => {
      // set only the top slot to revealed
      setSlots((s) => s.map((sl, i) => (i === s.length - 1 ? { ...sl, revealed: true } : sl)));
    };

    const toNext = () => {
      if (!running) return;
      setSlots((s) => {
        const cur = s[s.length - 1];
        const nextIdx = (cur.phraseIdx + 1) % PHRASES.length;

        const leaving: Slot = { ...cur, direction: "out", revealed: false };
        const incoming = makeSlot(nextIdx);
        return [leaving, incoming];
      });

      after(() => setSlots((s) => s.slice(-1)), OUT_MS);
      after(revealCurrent, CROSS_OVERLAP);

      after(toNext, CROSS_OVERLAP + REVEAL_HOLD);
    };

    const start = () => {
      if (running) return;
      running = true;

      revealCurrent();
      after(toNext, REVEAL_HOLD);
    };
    const stop = () => {
      running = false;
      clearTimers();
    };

    const sync = () => (onScreen && !hidden && !hovering && !inTransition ? start() : stop());

    const io = new IntersectionObserver(
      (es) => {
        onScreen = es[0]?.isIntersecting ?? false;
        sync();
      },
      { threshold: 0.2 },
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

    // hovering pauses the auto-cycle so the magnetism can play with the scraps
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onEnter = () => {
      hovering = true;
      sync();

      // and make sure whatever is on screen is fully revealed
      setSlots((s) => {
        if (s.length === 1 && s[0].revealed && s[0].direction === "in") return s;
        const cur = s[s.length - 1];
        return [{ ...cur, direction: "in", revealed: true }];
      });
    };
    const onLeave = () => {
      hovering = false;
      sync();
    };
    if (canHover) {
      host.addEventListener("pointerenter", onEnter);
      host.addEventListener("pointerleave", onLeave);
    }

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useMagnetism(hostRef);

  return (
    <div
      ref={hostRef}
      data-canvas-card
      aria-label="Short phrases spelled out as a ransom note from torn-paper cutout letters, revealing one letter at a time."
      style={viewTransitionName ? { viewTransitionName } : undefined}
      className="relative mx-auto flex aspect-[1344/620] w-full select-none items-center justify-center overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[var(--bg-page)] px-10 sm:px-16"
    >
      {/* absolutely-stacked slots so outgoing/incoming crossfade in place */}
      {slots.map((sl) => (
        <div key={sl.key} className="absolute inset-0 flex items-center justify-center px-10 sm:px-16">
          <RansomLine
            placed={sl.placed}
            lineH={lineH}
            revealed={sl.revealed}
            direction={sl.direction}
            nowrap
          />
        </div>
      ))}
    </div>
  );
}

export default RansomNoteCard;
