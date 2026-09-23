"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SlammingLine } from "./RansomLine";
import { useMagnetism } from "./use-magnetism";
import { composeLine, hashSeed, lineWidth, type JitterConfig } from "./manifest";
import { PG_PREVIEW } from "../swirl/controls";

const TEXT = "stay weird";
const SEED = hashSeed(TEXT);
const JITTER: JitterConfig = { rot: 8, dy: 0.06, scale: 0.12, gap: 0.2 };
const SIZE = 78;

export function RansomNotePlayground() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(900);

  const lines = useMemo(
    () => TEXT.split("\n").map((ln, i) => composeLine(ln.toUpperCase(), SEED + i * 101, JITTER)),
    [],
  );

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAvail(el.clientWidth));
    ro.observe(el);
    setAvail(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useMagnetism(stageRef);

  const fittedH = (placed: (typeof lines)[number]) => {
    // shrink to fit one row
    const room = avail * 0.94;
    const natural = lineWidth(placed, SIZE);
    if (natural <= room || natural <= 0) return SIZE;
    return Math.max(20, Math.floor((SIZE * room) / natural));
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* the note */}
      <div className={`${PG_PREVIEW} aspect-[1344/620] w-full bg-[var(--bg-page)]`}>
        <div
          ref={stageRef}
          className="absolute inset-0 flex flex-col items-center justify-center gap-[3%] overflow-hidden px-[5%]"
        >
          {/* one SlammingLine per source line */}
          {lines.map((placed, i) => (
            <SlammingLine key={i} placed={placed} lineH={fittedH(placed)} nowrap />
          ))}
        </div>
      </div>
    </div>
  );
}

export default RansomNotePlayground;
