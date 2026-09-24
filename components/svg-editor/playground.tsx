"use client";

import { getAnimationTheme, themeColor } from "../../lib/animation-theme";

import { useMemo, useState } from "react";
import { FigmaFrame, DEFAULT_FRAME } from "./standalone/FigmaFrame";
import { VectorEditor, DEFAULT_EDITOR, type EditorStyle } from "./standalone/VectorEditor";
import { parsePath, serializePath, bounds } from "./standalone/parse";
import type { VectorPath } from "./standalone/types";
import { FitStage } from "../fit-stage";

const HEART =
  "M 100 30 C 100 20, 84 6, 66 6 C 42 6, 28 24, 28 44 C 28 74, 58 92, 100 122 C 142 92, 172 74, 172 44 C 172 24, 158 6, 134 6 C 116 6, 100 20, 100 30 Z";
const BOLT = "M 60 6 L 26 70 L 52 70 L 44 122 L 92 52 L 62 52 Z";

export default function SvgEditorPlayground() {
  const [heart, setHeart] = useState<VectorPath>(() => parsePath(HEART));
  const [bolt, setBolt] = useState<VectorPath>(() => parsePath(BOLT));

  const heartB = useMemo(() => bounds(heart), [heart]);
  const boltB = useMemo(() => bounds(bolt), [bolt]);

  const editorStyle: EditorStyle = {
    ...DEFAULT_EDITOR,
    accent: themeColor("accent", DEFAULT_EDITOR.accent),
    arm: themeColor("accent", DEFAULT_EDITOR.arm),
    pointFill: themeColor("background", DEFAULT_EDITOR.pointFill),
    showRig: false,
  };
  const frame = {
    ...DEFAULT_FRAME,
    accent: themeColor("accent", "#0d99ff"),
    handleFill: themeColor("background", DEFAULT_FRAME.handleFill),
    badgeBg: themeColor("accent", DEFAULT_FRAME.badgeBg),
    badgeText: themeColor("foreground", DEFAULT_FRAME.badgeText),
  };

  return (
    <div
      data-canvas-card
      aria-label="A Figma-style vector editor: blue selection boxes with corner handles and size tags around two shapes, with draggable bezier points and handles to bend them."
      className="relative mx-auto flex aspect-[1344/620] w-full select-none flex-col items-center justify-center gap-8 overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-white"
      style={{ backgroundColor: themeColor("background", "#ffffff") }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: getAnimationTheme().background
            ? "none"
            : "linear-gradient(#eef4fb 1px, transparent 1px), linear-gradient(90deg, #eef4fb 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <FitStage className="relative flex flex-col items-center gap-8">
        <div className="relative flex items-center justify-center gap-x-16">
          <FigmaFrame style={frame}>
            <VectorEditor
              path={heart}
              onChange={setHeart}
              style={{ ...editorStyle, fill: themeColor("foreground", "#ff5c8a"), fillOpacity: getAnimationTheme().foreground ? 1 : editorStyle.fillOpacity, stroke: themeColor("accent", "#ff5c8a") }}
              viewBox={[0, 0, 200, 130]}
              width={260}
              height={169}
            />
          </FigmaFrame>

          <FigmaFrame style={frame}>
            <VectorEditor
              path={bolt}
              onChange={setBolt}
              style={{ ...editorStyle, fill: themeColor("foreground", "#ffb02e"), fillOpacity: getAnimationTheme().foreground ? 1 : editorStyle.fillOpacity, stroke: themeColor("accent", "#ffb02e"), showRig: true, anchorR: 3.4, handleR: 2.8 }}
              viewBox={[0, 0, 120, 130]}
              width={190}
              height={206}
            />
          </FigmaFrame>
        </div>

        <div className="relative flex items-center gap-6 font-mono text-[11px] text-[#5b6b7f]" style={{ color: themeColor("foreground", "#5b6b7f") }}>
          <span className="rounded-[6px] bg-[#f1f4f8] px-3 py-1">
            d = {serializePath(heart).slice(0, 46)}…
          </span>
          <span className="rounded-[6px] bg-[#f1f4f8] px-3 py-1">
            bbox = {Math.round(heartB.w)} × {Math.round(heartB.h)} / {Math.round(boltB.w)} × {Math.round(boltB.h)}
          </span>
        </div>
      </FitStage>
    </div>
  );
}
