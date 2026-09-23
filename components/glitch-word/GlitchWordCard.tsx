"use client";

import { useEffect, useRef } from "react";
import { ACTIVE, GlitchWord, IDLE } from "./engine";
import { onTransitionChange } from "../../lib/view-transition";

const WORD = "glitching";

const LAYERS = 10;

export function GlitchWordCard({ bare = false }: { bare?: boolean } = {}) {
  void bare;
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const base = host.querySelector<HTMLElement>("[data-glitch-base]");
    const layers = Array.from(
      host.querySelectorAll<HTMLElement>("[data-glitch-layer]"),
    );
    if (!base) return;

    const engine = new GlitchWord(base, layers, WORD, reduced);

    let onScreen = false;
    let hidden = false;
    let inTransition = false;
    let hovered = false;

    const magnet = host.querySelector<HTMLElement>("[data-glitch-magnet]");
    const PULL = 0.18;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      if (!magnet || reduced) return;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = host.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;

        const reach = Math.hypot(r.width, r.height) / 2;
        const falloff = Math.max(0, 1 - Math.hypot(dx, dy) / reach);
        const k = PULL * falloff * falloff;
        magnet.style.transition = "none";
        magnet.style.transform = `translate3d(${(dx * k).toFixed(2)}px,${(dy * k).toFixed(2)}px,0)`;
      });
    };

    const onLeaveMagnet = () => {
      if (!magnet) return;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      magnet.style.transition = "transform 620ms var(--ease-amo, cubic-bezier(0.34, 1.56, 0.64, 1))";
      magnet.style.transform = "translate3d(0,0,0)";
    };

    const sync = () => {
      if (reduced) return;
      if (onScreen && !hidden && !inTransition) {
        engine.start();
      } else {
        engine.stop();
      }
    };

    const io = new IntersectionObserver(
      (es) => {
        onScreen = es.some((e) => e.isIntersecting);
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
    const onEnter = () => {
      if (hovered) return;
      hovered = true;
      engine.setOptions(ACTIVE);
      host.dataset.hot = "true";
    };
    const onLeave = () => {
      if (!hovered) return;
      hovered = false;
      engine.setOptions(IDLE);
      delete host.dataset.hot;
    };
    if (fine && !reduced) {
      host.addEventListener("pointerenter", onEnter);
      host.addEventListener("pointerleave", onLeave);
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeaveMagnet);
    }

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      if (fine && !reduced) {
        host.removeEventListener("pointerenter", onEnter);
        host.removeEventListener("pointerleave", onLeave);
        host.removeEventListener("pointermove", onMove);
        host.removeEventListener("pointerleave", onLeaveMagnet);
      }
      if (raf) cancelAnimationFrame(raf);
      engine.destroy();
    };
  }, []);

  const CELL = "col-start-1 row-start-1";
  const TEXT =
    "gw-text";

  return (
    <div
      ref={hostRef}
      data-canvas-card
      role="img"
      aria-label="The word 'glitching' in a small badge, tearing itself apart: stacked copies of the text clipped into bands and shoved sideways, while a few letters flicker into punctuation"
      className="relative flex aspect-[1344/620] w-full select-none items-center justify-center overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[var(--bg-hover)]"
    >
      {}
      {}
      <span
        data-glitch-magnet
        className="relative inline-block will-change-transform"
      >
      <span className="relative grid place-items-center">
        {}
        <span aria-hidden="true" className={`${CELL} ${TEXT} invisible`}>
          {WORD}
        </span>

        {/* The original. It carries the real text, so the scramble writes here
            and the shake moves it. */}
        {/* data-glitch-base is on the WRAPPER, not on the text.

            The engine translates this element for the shake. With the attribute
            on the inner span it moved the glyphs alone and left the badge - its
            own sibling - perfectly still, which is the whole reason the block
            looked static while the letters jittered. The text slot below is
            marked separately so the scramble still knows where to write. */}
        <span data-glitch-base className={`${CELL} relative z-10`}>
          <span
            data-glitch-badge
            className="gw-badge absolute -inset-x-3 -top-1 -bottom-1 rounded-[8px]"
          />
          <span data-glitch-text className={`${TEXT} relative text-white`}>
            {WORD}
          </span>
        </span>

        {}
        {Array.from({ length: LAYERS }).map((_, i) => (
          <span
            key={i}
            data-glitch-layer
            aria-hidden="true"
            style={{ opacity: 0 }}
            className={`${CELL} pointer-events-none relative z-10`}
          >
            {}
            <span
              className="gw-badge absolute -inset-x-3 -top-1 -bottom-1 rounded-[8px]"
              style={{ animationDelay: `${-(i * 2.4).toFixed(1)}s` }}
            />
            <span data-glitch-text className={`${TEXT} relative text-white`}>
              {WORD}
            </span>
          </span>
        ))}
      </span>
      </span>
    </div>
  );
}

export default GlitchWordCard;
