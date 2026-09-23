"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { LiquidGroup, LiquidCard } from "./LiquidGroup";
import { PG_PREVIEW, PREVIEW_STYLE } from "../swirl/controls";
import { hapticTap } from "../../lib/haptics";
import { useSceneSet } from "./use-compact";
import type { ScenePiece } from "./scenes";

export function LiquidPlayground() {
  const set = useSceneSet();
  const presets = set.playground;
  const { vw: VW, vh: VH } = set;
  const { k, cell } = presets[0];

  const [cards, setCards] = useState<ScenePiece[]>(() => presets[0].pieces.map((c) => ({ ...c })));

  const [activePresets, setActivePresets] = useState(presets);
  if (activePresets !== presets) {
    setActivePresets(presets);
    setCards(presets[0].pieces.map((c) => ({ ...c })));
  }

  const stageRef = useRef<HTMLDivElement>(null);

  const spaceRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  useEffect(() => {
    drag.current = null;
  }, [presets]);

  const toLocal = useCallback(
    (clientX: number, clientY: number) => {

      const el = spaceRef.current ?? stageRef.current;
      if (!el) return { x: 0, y: 0 };
      const r = el.getBoundingClientRect();
      return {
        x: ((clientX - r.left) / r.width) * VW,
        y: ((clientY - r.top) / r.height) * VH,
      };
    },
    [VW, VH],
  );

  const onPointerDown = (id: string) => (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const p = toLocal(e.clientX, e.clientY);
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    drag.current = { id, dx: p.x - card.x, dy: p.y - card.y };
    hapticTap();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const p = toLocal(e.clientX, e.clientY);
    const { id, dx, dy } = drag.current;

    const slack = VW * 0.055;
    setCards((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              x: Math.max(-slack, Math.min(VW - c.w + slack, p.x - dx)),
              y: Math.max(-slack, Math.min(VH - c.h + slack, p.y - dy)),
            }
          : c,
      ),
    );
  };
  const endDrag = () => {
    drag.current = null;
  };

  const groupBridges = useMemo(() => [], []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
      {}
      <div className={`${PG_PREVIEW} touch-none`} style={PREVIEW_STYLE}>
        <div
          ref={stageRef}
          style={{ position: "relative", width: "100%", aspectRatio: `${VW} / ${VH}` }}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div style={{ position: "absolute", inset: 0, containerType: "size" } as CSSProperties}>
            {}
            <div
              ref={spaceRef}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: VW,
                height: VH,
                transform: "translate(-50%, -50%)",
                transformOrigin: "center",
                scale: `calc(100cqw / ${set.pgDiv})`,
              }}
            >
              <LiquidGroup
                k={k}
                cardRadius={set.cardRadius}
                cell={cell}
                smooth={2}
                bridges={groupBridges}
                fill="var(--bg-surface)"
                className="h-full w-full"
              >
                {cards.map((c) => (
                  <LiquidCard key={c.id} id={c.id} x={c.x} y={c.y} w={c.w} h={c.h} radius={c.radius}>
                    <div
                      onPointerDown={onPointerDown(c.id)}
                      style={{ height: "100%", width: "100%", cursor: "grab" }}
                    >
                      {c.content}
                    </div>
                  </LiquidCard>
                ))}
              </LiquidGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiquidPlayground;
