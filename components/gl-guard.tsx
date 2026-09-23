"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The page runs more WebGL cards than Chrome keeps contexts for (~16), so the
 * browser drops the oldest ones. None of the engines restore themselves, so
 * this remounts the card the next time it scrolls into view after a loss.
 */
export function GLGuard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [gen, setGen] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let lost = false;
    let visible = false;
    const remount = () => {
      lost = false;
      setGen((g) => g + 1);
    };
    // webglcontextlost does not bubble, so listen in the capture phase
    const onLost = () => {
      lost = true;
      if (visible) requestAnimationFrame(remount);
    };
    el.addEventListener("webglcontextlost", onLost, true);
    const io = new IntersectionObserver((es) => {
      visible = es[0]?.isIntersecting ?? false;
      if (visible && lost) remount();
    });
    io.observe(el);
    return () => {
      el.removeEventListener("webglcontextlost", onLost, true);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={ref}>
      <div key={gen}>{children}</div>
    </div>
  );
}

export default GLGuard;
