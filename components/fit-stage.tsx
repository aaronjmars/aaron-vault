"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Scales fixed-pixel content so it fits the card it sits in. By default it only
 * shrinks; raise `max` to let it grow on wide cards. Measures layout size,
 * which transforms do not affect, so it cannot loop.
 */
export function FitStage({
  children,
  className = "",
  pad = 0.92,
  max = 1,
}: {
  children: ReactNode;
  className?: string;
  pad?: number;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = ref.current;
    const host = stage?.parentElement;
    if (!stage || !host) return;
    const fit = () => {
      const w = stage.offsetWidth;
      const h = stage.offsetHeight;
      if (!w || !h) return;
      const s = Math.min(max, (host.clientWidth * pad) / w, (host.clientHeight * pad) / h);
      stage.style.transform = `scale(${s})`;
    };
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    ro.observe(stage);
    fit();
    return () => ro.disconnect();
  }, [pad, max]);

  return (
    <div ref={ref} className={`w-max shrink-0 ${className}`}>
      {children}
    </div>
  );
}

export default FitStage;
