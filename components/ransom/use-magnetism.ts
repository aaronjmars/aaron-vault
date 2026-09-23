"use client";

import { useEffect, type RefObject } from "react";

/**
 * useMagnetism - support hook the ransom source imports but doesn't ship.
 * While the cursor is over the host, each scrap (any element carrying
 * data-depth inside the host) leans toward the pointer: the outer span reads
 * --px/--py/--pr/--ps custom properties, so we just set those. Everything eases
 * back to rest on leave. Runs on a rAF loop that stops when idle.
 */
export function useMagnetism(hostRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (typeof window === "undefined") return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    let raf = 0;
    let active = false;
    // per-element eased state
    const state = new WeakMap<HTMLElement, { x: number; y: number; r: number }>();
    let mx = 0;
    let my = 0;
    let live: HTMLElement[] = [];

    const collect = () => {
      live = [...host.querySelectorAll<HTMLElement>("[data-depth]")];
    };

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      mx = e.clientX - (r.left + r.width / 2);
      my = e.clientY - (r.top + r.height / 2);
      if (!active) {
        active = true;
        collect();
        raf = requestAnimationFrame(tick);
      }
    };
    const onLeave = () => {
      active = false;
    };

    const tick = () => {
      const k = active ? 0.14 : 0.1;
      let moving = active;
      if (!active) collect();
      for (const el of live) {
        const depth = parseFloat(el.dataset.depth || "0.5");
        const er = el.getBoundingClientRect();
        const hr = host.getBoundingClientRect();
        const ecx = er.left + er.width / 2 - (hr.left + hr.width / 2);
        const ecy = er.top + er.height / 2 - (hr.top + hr.height / 2);
        // pull toward the cursor, stronger for nearer/deeper scraps
        const dx = active ? mx - ecx : 0;
        const dy = active ? my - ecy : 0;
        const d = Math.hypot(dx, dy) || 1;
        const pull = Math.max(0, 1 - d / 420) * depth;
        const tx = (dx / d) * 26 * pull;
        const ty = (dy / d) * 18 * pull;
        const tr = (dx / d) * 3.5 * pull;
        const s = state.get(el) ?? { x: 0, y: 0, r: 0 };
        s.x += (tx - s.x) * k;
        s.y += (ty - s.y) * k;
        s.r += (tr - s.r) * k;
        if (Math.abs(s.x) > 0.05 || Math.abs(s.y) > 0.05 || Math.abs(s.r) > 0.05) moving = true;
        else { s.x = 0; s.y = 0; s.r = 0; }
        state.set(el, s);
        el.style.setProperty("--px", `${s.x.toFixed(2)}px`);
        el.style.setProperty("--py", `${s.y.toFixed(2)}px`);
        el.style.setProperty("--pr", `${s.r.toFixed(2)}deg`);
        el.style.setProperty("--ps", (1 + Math.abs(s.r) * 0.004).toFixed(3));
      }
      if (moving || active) raf = requestAnimationFrame(tick);
      else raf = 0;
    };

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [hostRef]);
}
