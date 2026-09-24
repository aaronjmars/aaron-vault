"use client";

import { themeColor } from "../../lib/animation-theme";
import { useEffect, useRef } from "react";
import { Typer, TyperGroup } from "./standalone/typer";
import "./standalone/typer.css";

const LINES = [
  "design engineered by me :)",
  "fifty-nine studies in motion",
  "each letter earns its place",
];

export default function TyperPlayground() {
  const blockRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<TyperGroup | null>(null);

  useEffect(() => {
    const block = blockRef.current;
    if (!block) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lines = [...block.querySelectorAll<HTMLElement>("[data-typer]")];
    if (reduced) {
      lines.forEach((el) => new Typer(el, { initVisible: true }));
      return;
    }
    const group = new TyperGroup(lines, { fps: 20, cycles: 3 }, 0.15);
    groupRef.current = group;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          group.in();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(block);
    return () => {
      io.disconnect();
      group.destroy();
      groupRef.current = null;
    };
  }, []);

  return (
    <div
      data-canvas-card
      aria-label="Headlines that type in: a wave sweeps each line and every letter flickers through solid pills, highlights and outlines before settling. Adjacent letters in the same state merge into one rounded bar."
      className="@container relative mx-auto flex aspect-[1344/620] w-full select-none flex-col items-center justify-center gap-2 overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[var(--bg-surface,#fcfcfc)] text-center"
      style={{ ["--typer-accent" as string]: themeColor("accent", "#12a150"), ["--typer-fg" as string]: themeColor("foreground", "#1b1b1b"), ["--typer-bg" as string]: themeColor("background", "#fcfcfc"), backgroundColor: themeColor("background", "#fcfcfc") }}
    >
      <div
        ref={blockRef}
        className="typer-block flex flex-col items-center gap-1 font-semibold"
        style={{ fontSize: "clamp(0.6rem, 5.4cqw, 2.4rem)", whiteSpace: "nowrap" }}
      >
        {LINES.map((l) => (
          <span key={l} data-typer data-typer-type="initial">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
