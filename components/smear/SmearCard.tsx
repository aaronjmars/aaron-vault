"use client";

import { useEffect, useRef } from "react";
import { FadeMotion, pixelFontSpec } from "./engine";
import { onTransitionChange } from "../../lib/view-transition";

export function SmearCard({
  bare = false,
  viewTransitionName,
}: { bare?: boolean; viewTransitionName?: string } = {}) {
  void bare;
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let engine: FadeMotion | null = null;
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

    const create = () => {
      if (created) return;
      created = true;
      raf = requestAnimationFrame(() => {
        if (!hostRef.current) return;
        engine = new FadeMotion(host);
        if (!engine.ok) return;

        if (!reduced) engine.enableHero(2);

        engine.onBg = (css) => {
          host.style.backgroundColor = css;
        };

        if (document.fonts?.load) {
          document.fonts
            .load(pixelFontSpec())
            .catch(() => {})
            .then(() => engine?.refreshFonts());
          document.fonts.ready.then(() => engine?.refreshFonts()).catch(() => {});
        }
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

    const fine = window.matchMedia("(pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      if (!engine || reduced) return;
      const r = host.getBoundingClientRect();
      engine.setPointer({
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
      });
    };
    const onLeave = () => engine?.setPointer(null);
    if (fine) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);

      host.addEventListener("pointercancel", onLeave);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      if (fine) {
        host.removeEventListener("pointermove", onMove);
        host.removeEventListener("pointerleave", onLeave);
        host.removeEventListener("pointercancel", onLeave);
      }
      engine?.destroy();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      data-canvas-card
      style={{ viewTransitionName }}
      aria-label="A word trailing downward into light, its fade built from hundreds of overlapping copies"
      className="relative aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[var(--bg-hover)]"
    />
  );
}

export default SmearCard;
