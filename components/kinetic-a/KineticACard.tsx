"use client";

import { themeColor } from "../../lib/animation-theme";
import { useEffect, useRef, type CSSProperties } from "react";
import { KineticA as Engine, type KineticParams } from "./engine";
import { onTransitionChange } from "../../lib/view-transition";

export const DEFAULT_PARAMS: KineticParams = {
  text: "a",
  paper: "#fcfcfc",
  ink: "#1b1b1b",
  accent: "#3b82f6",
  tiles: 34,
  offset: 26,
  speed: 0.02,
  spread: 0.025,
  chroma: 0.35,
  shade: 0.35,
  grain: 0.7,
};

export function KineticACard({
  flush = false,
  params = DEFAULT_PARAMS,
  viewTransitionName,
}: {
  flush?: boolean;
  params?: KineticParams;
  viewTransitionName?: string;
} = {}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const themedParams = { ...params, paper: themeColor("background", params.paper), ink: themeColor("foreground", params.ink), accent: themeColor("accent", params.accent) };
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const engine = new Engine(stage, themedParams);
    engineRef.current = engine;

    if (typeof document !== "undefined" && document.fonts) {
      const fam = getComputedStyle(document.documentElement)
        .getPropertyValue("--font-woodland")
        .split(",")[0]
        .trim();
      if (fam) {
        document.fonts.load(`700 64px ${fam}`).then(() => engine.refreshLetter()).catch(() => {});
      }
    }

    if (reduced) {
      engine.renderStatic();
      return () => {
        engine.destroy();
        engineRef.current = null;
      };
    }

    let onScreen = true;
    let hidden = false;
    let inTransition = false;

    const running = () => onScreen && !hidden && !inTransition;
    const sync = () => {
      if (running()) engine.start();
      else engine.stop();
    };
    sync();

    const ro = new ResizeObserver(() => engine.resize());
    ro.observe(stage);
    const io = new IntersectionObserver((es) => {
      onScreen = es[0]?.isIntersecting ?? true;
      sync();
    });
    io.observe(stage);
    const onVis = () => {
      hidden = document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVis);
    const offTransition = onTransitionChange((active) => {
      inTransition = active;
      sync();
    });

    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      offTransition();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setParams(themedParams);
  }, [params]);

  const shape = flush
    ? "relative z-10 rounded-xl border"
    : "rounded-[12px] border";

  const style: CSSProperties | undefined = viewTransitionName
    ? { viewTransitionName, background: themedParams.paper }
    : { background: themedParams.paper };

  return (
    <div
      ref={stageRef}
      data-canvas-card
      style={style}
      className={`relative mx-auto aspect-video w-full select-none overflow-hidden border-[var(--border-line)] ${shape}`}
    />
  );
}

export default KineticACard;
