"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { videoSources, mediaUrl } from "../../lib/video-sources";
import { buttonHover, buttonClick, type ButtonSound } from "../../lib/sound";
import { hapticHover, hapticTap } from "../../lib/haptics";

type Variant = "light" | "blue" | "dark";
type Phase = "idle" | "fwd" | "rev";

const BASE =
  "relative z-0 inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-full px-5 py-2.5";

function pill(variant: Variant): { className: string; style: CSSProperties; overlays?: ReactNode; labelStyle?: CSSProperties } {
  if (variant === "blue") {
    return {
      className: `${BASE} text-[15px] font-medium text-white`,
      style: {
        background: "linear-gradient(180deg, #3CB2CD 0%, #1D6EB1 100%)",
        boxShadow:
          "rgba(142,217,255,0.5) 0px -1px 4.1px 0.5px inset, rgb(190,226,255) 0px 0px 4px 0px inset, rgba(43,162,189,0.5) 0px -36px 14.2px -28px inset",
      },
      labelStyle: { textShadow: "0px 1px 2px rgba(0,0,0,0.5)" },
      overlays: (
        <span
          aria-hidden
          className="pointer-events-none absolute left-2.5 right-2.5 top-[-4.5px] h-7 rounded-[500px] opacity-70 blur-[1px]"
          // plain sRGB stops: Tailwind 4 gradients interpolate in oklab, which greys the fade
          style={{ background: "linear-gradient(to top, rgba(255,255,255,0), #fff)" }}
        />
      ),
    };
  }
  if (variant === "dark") {
    return {
      className: `${BASE} text-[14px] font-normal leading-[20px] tracking-[0.02em] text-white/90 backdrop-blur-[6px]`,
      style: { background: "transparent" },
      overlays: (
        <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "rgba(0,0,0,0.56)" }}>
          <span className="absolute inset-0" style={{ opacity: 0.12, background: "linear-gradient(180deg, #fff 0%, rgba(255,255,255,0) 100%)" }} />
          <span className="absolute inset-0" style={{ opacity: 0.32, background: "radial-gradient(65.62% 65.62% at 50% 50%, #000 0%, rgba(0,0,0,0) 100%)" }} />
          <span
            className="absolute inset-0"
            style={{
              opacity: 0.24,
              padding: "1px",
              background: "linear-gradient(180deg, #fff 0%, #999 55%, #fff 80%, #999 95%)",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
            }}
          />
        </span>
      ),
    };
  }
  return {
    className: `${BASE} border border-[var(--border-line)] text-[15px] font-medium text-[#1b1b1b] backdrop-blur-[2px]`,
    style: {
      background: "linear-gradient(180deg, #fff 0%, rgba(255,255,255,0) 100%), #f1f0ea",
      boxShadow: "0 -1px 1.5px 0 rgba(71,58,45,0.12) inset, 0 1.5px 6px rgba(71,58,45,0.06)",
    },
  };
}

function sourcesFor(base: string, alpha: boolean): ReactNode {
  if (alpha) {
    return (
      <>
        <source src={mediaUrl(`${base}.alpha.webm`)} type="video/webm" />
        <source src={mediaUrl(`${base}.alpha.hevc.mp4`)} type='video/mp4; codecs="hvc1"' />
      </>
    );
  }
  return videoSources(base).map((s) => <source key={s.src} src={s.src} type={s.type} />);
}

export function HoverVideoButton({
  label,
  video,
  reverseVideo,
  poster,
  width = 320,
  variant = "light",
  speed = 1,
  alpha = false,
  offsetX = 0,
  offsetY = 0,
  sound,
}: {
  label: string;

  video: string;

  reverseVideo?: string;
  poster?: string;
  width?: number;
  variant?: Variant;
  speed?: number;
  alpha?: boolean;

  offsetX?: number;

  offsetY?: number;

  sound?: ButtonSound;
}) {
  const wrapRef = useRef<HTMLElement | null>(null);
  const fwdRef = useRef<HTMLVideoElement>(null);
  const revRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const hoverable = useRef(true);

  useEffect(() => {
    hoverable.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  // `pop` is a spring toward 0; each click adds
  const magTarget = useRef({ x: 0, y: 0 });
  const magCur = useRef({ x: 0, y: 0 });
  const popTarget = useRef(0);
  const popPos = useRef(0);
  const popVel = useRef(0);
  const rafRef = useRef(0);

  const tick = () => {
    const el = wrapRef.current;
    if (!el) {
      rafRef.current = 0;
      return;
    }
    const tx = magTarget.current.x;
    const ty = magTarget.current.y;
    magCur.current.x += (tx - magCur.current.x) * 0.2;
    magCur.current.y += (ty - magCur.current.y) * 0.2;

    popTarget.current *= 0.9;
    if (popTarget.current < 0.001) popTarget.current = 0;
    popVel.current += (popTarget.current - popPos.current) * 0.22;
    popVel.current *= 0.68;
    popPos.current += popVel.current;
    const s = 1 + popPos.current;
    el.style.transform = `translate(${magCur.current.x.toFixed(2)}px, ${magCur.current.y.toFixed(2)}px) scale(${s.toFixed(3)})`;
    const restMag = Math.abs(tx - magCur.current.x) < 0.08 && Math.abs(ty - magCur.current.y) < 0.08;
    const restPop =
      popTarget.current === 0 && Math.abs(popPos.current) < 0.001 && Math.abs(popVel.current) < 0.001;
    if (restMag && restPop && tx === 0 && ty === 0) {
      el.style.transform = "";
      rafRef.current = 0;
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  };
  const wake = () => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
  };
  const popClick = () => {
    if (reduced) return;
    popTarget.current = Math.min(popTarget.current + 0.06, 0.28);
    wake();
  };

  useEffect(() => {
    if (reduced) return;
    const box = wrapRef.current?.parentElement;
    if (!box) return;
    const STRENGTH = 0.1;
    const MAX = 9;
    const clamp = (v: number) => Math.max(-MAX, Math.min(MAX, v));
    const onMove = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      magTarget.current.x = clamp((e.clientX - (r.left + r.width / 2)) * STRENGTH);
      magTarget.current.y = clamp((e.clientY - (r.top + r.height / 2)) * STRENGTH);
      wake();
    };
    const onLeave = () => {
      magTarget.current.x = 0;
      magTarget.current.y = 0;
      wake();
    };
    box.addEventListener("pointermove", onMove);
    box.addEventListener("pointerleave", onLeave);
    return () => {
      box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reduced]);

  const enter = () => {
    if (reduced) return;
    setPhase("fwd");
  };
  const leave = () => {
    if (reduced) return;
    setPhase(reverseVideo ? "rev" : "idle");
  };

  useEffect(() => {
    if (reduced) return;
    const fwd = fwdRef.current;
    const rev = revRef.current;
    if (!fwd) return;

    if (phase === "fwd") {
      rev?.pause();
      fwd.currentTime = 0;
      fwd.playbackRate = speed;
      fwd.play().catch(() => {});
    } else if (phase === "rev" && rev) {
      const D = fwd.duration || rev.duration || 0;
      const t = Math.min(fwd.currentTime || 0, D);
      fwd.pause();
      rev.currentTime = Math.max(0, D - t);
      rev.playbackRate = speed * 1.3;
      rev.play().catch(() => {});
    } else {
      fwd.pause();
      fwd.currentTime = 0;
      rev?.pause();
    }
  }, [phase, speed, reduced]);

  useEffect(() => {
    if (reduced || phase !== "fwd") return;
    const el = fwdRef.current;
    if (!el) return;
    const AMP = 0.6, DECAY = 3.5, FREQ = 11;
    const TAIL = 0.6, SLOW = 0.62;
    let raf = 0;
    const tick = () => {
      if (el.ended) return;
      const D = el.duration || 1;
      const p = Math.min(1, (el.currentTime || 0) / D);
      const wobble = 1 + AMP * Math.exp(-DECAY * p) * Math.sin(FREQ * p);
      const tp = Math.max(0, (p - TAIL) / (1 - TAIL));
      const ease = tp * tp * (3 - 2 * tp);
      const slow = 1 - SLOW * ease;
      el.playbackRate = Math.max(0.25, speed * wobble * slow);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, speed, reduced]);

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    const warm = (v: HTMLVideoElement | null) => {
      if (!v) return;
      v.muted = true;
      const p = v.play();
      if (p) {
        p.then(() => {
          if (cancelled) return;
          v.pause();
          v.currentTime = 0;
        }).catch(() => {});
      }
    };
    const id = window.setTimeout(() => {
      warm(fwdRef.current);
      warm(revRef.current);
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [reduced]);

  useEffect(() => {
    if (phase === "idle" || hoverable.current) return;
    const onDoc = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) leave();
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [phase]);

  const setWrap = (el: HTMLElement | null) => {
    wrapRef.current = el;
  };

  const fwd = (
    <video
      ref={fwdRef}
      muted
      playsInline
      preload="auto"
      loop={!reverseVideo}
      poster={poster}
      className="block h-auto w-full"
      style={{ opacity: phase === "rev" ? 0 : 1 }}
    >
      {sourcesFor(video, alpha)}
    </video>
  );
  const rev = reverseVideo ? (
    <video
      ref={revRef}
      muted
      playsInline
      preload="auto"
      onEnded={() => setPhase("idle")}
      className="absolute inset-0 block h-auto w-full"
      style={{ opacity: phase === "rev" ? 1 : 0 }}
    >
      {sourcesFor(reverseVideo, alpha)}
    </video>
  ) : null;

  const p = pill(variant);
  const visible = phase !== "idle" && !reduced;

  return (
    <div
      ref={setWrap}
      className="relative inline-flex cursor-pointer"
      onPointerEnter={() => {
        if (!hoverable.current) return;
        enter();
        if (sound) buttonHover(sound);
        hapticHover();
      }}
      onPointerLeave={() => hoverable.current && leave()}
      onPointerDown={() => {
        if (sound) buttonClick(sound);
        hapticTap();
        popClick();
      }}
    >
      <button
        type="button"
        onClick={() => {
          if (hoverable.current) return;
          if (phase === "fwd") leave();
          else enter();
        }}
        className={p.className}
        style={{ ...p.style, opacity: visible ? 0 : 1 }}
      >
        {p.overlays}
        <span className="relative z-10" style={p.labelStyle}>
          {label}
        </span>
      </button>

      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-10"
        style={{
          width: `min(${width}px, 78vw)`,
          opacity: visible ? 1 : 0,
          transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
        }}
      >
        {fwd}
        {rev}
      </div>
    </div>
  );
}
