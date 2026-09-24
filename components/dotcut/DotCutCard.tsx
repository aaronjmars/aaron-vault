"use client";

import { themeColor } from "../../lib/animation-theme";
import { useEffect, useRef } from "react";
import { DotCut } from "./engine";
import { onTransitionChange } from "../../lib/view-transition";

const FONT_CSS = "var(--font-neue-montreal)";

export function DotCutCard({ bare = false }: { bare?: boolean } = {}) {
  void bare;
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: DotCut | null = null;
    let raf = 0;
    let created = false;
    let onScreen = false;
    let hidden = false;
    let inTransition = false;

    const running = () => onScreen && !hidden && !inTransition;
    const sync = () => {
      if (!engine || reduced) return;
      if (running()) engine.start();
      else engine.stop();
    };

    const resolveFamily = () => {
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden";
      probe.style.fontFamily = FONT_CSS;
      probe.textContent = "Ag";
      document.body.appendChild(probe);
      const fam = getComputedStyle(probe)
        .fontFamily.split(",")[0]
        .replace(/["']/g, "")
        .trim();
      probe.remove();
      return fam;
    };

    const create = () => {
      if (created) return;
      created = true;
      raf = requestAnimationFrame(() => {
        if (!hostRef.current) return;
        const fam = resolveFamily();
        engine = new DotCut(host, fam ? `"${fam}", sans-serif` : undefined);
        if (!engine.ok) return;
        if (reduced) engine.renderStill();
        else sync();
      });
    };

    const io = new IntersectionObserver(
      (es) => {
        onScreen = es.some((e) => e.isIntersecting);
        if (onScreen && !created) create();
        if (created) sync();
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

    const onMove = (e: PointerEvent) => {
      if (!engine) return;
      const r = host.getBoundingClientRect();
      const cell = engine.toCell(e.clientX - r.left, e.clientY - r.top);
      engine.setPointer(cell);
    };
    const onLeave = () => engine?.setPointer(null);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
      engine?.destroy();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      data-canvas-card
      role="img"
      aria-label="A dense grid of touching circles with symbols and patterns cut out of them as negative space. The field continuously reorganises between a letter, rings, columns, checks, boxes and bars, and rubbing the pointer across it retracts the mesh."
      className="relative aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[#1f45f5]"
      style={{ backgroundColor: themeColor("background", "#1f45f5") }}
    />
  );
}

export default DotCutCard;
