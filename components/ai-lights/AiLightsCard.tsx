"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DARK_KEYS, VARIANTS, radiusFor, useVariantSizes } from "./variants";
import { RimGlow } from "./RimGlow";
import { Surface } from "./Surface";
import { useAiPulse, useRimMask } from "./use-ai-lights";

const PULSE_MS = 1600;

const FADE_OUT_MS = 160;

const MORPH_MS = 380;

const HANDOVER_AT = PULSE_MS + 120;

const SETTLED_MS = 260;

const GAP_MS =
  HANDOVER_AT - PULSE_MS + FADE_OUT_MS + MORPH_MS + 80 + SETTLED_MS;

export function AiLightsCard({ bare = false }: { bare?: boolean } = {}) {
  void bare;

  const bodyRef = useRef<HTMLDivElement>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const { sizes, probe } = useVariantSizes();

  const [slot, setSlot] = useState(0);
  const slotRef = useRef(0);

  const [showing, setShowing] = useState(true);

  const [morphing, setMorphing] = useState(false);

  const [gen, setGen] = useState(0);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [];
  };
  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const variant = VARIANTS[slot];
  const size = sizes?.[slot];

  const radius = size ? radiusFor(variant, size.h + 2) : 0;

  const layers = useRimMask(bodyRef, 90, undefined, radius);

  useAiPulse({
    pulseMs: PULSE_MS,
    gapMs: GAP_MS,
    onPulse: useCallback(() => {

      clearTimers();
      after(HANDOVER_AT, () => {

        setShowing(false);

        after(FADE_OUT_MS, () => {

          bodyRef.current?.removeAttribute("data-playing");
          setMorphing(true);
          slotRef.current = (slotRef.current + 1) % VARIANTS.length;
          setSlot(slotRef.current);
          after(MORPH_MS, () => {
            setMorphing(false);
            setGen((g) => g + 1);
            setShowing(true);
          });
        });
      });
    }, []),
    ref: bodyRef,
    paletteRef: cardRef,
  });

  useEffect(() => clearTimers, []);

  return (
    <div
      data-canvas-card
      data-ai-card
      aria-hidden="true"
      ref={cardRef}

      className="relative flex aspect-[1344/620] w-full select-none items-center justify-center overflow-hidden rounded-[12px] border border-[var(--border-line)] ai-lights-bg"
    >
      {}
      {probe}

      {}
      <div
        ref={bodyRef}
        data-morphing={morphing ? "true" : undefined}

        className="ai-lights relative rounded-[var(--r)] p-px"
        style={
          {
            width: size ? `${size.w + 2}px` : undefined,
            height: size ? `${size.h + 2}px` : undefined,
            "--r": `${radius}px`,
            "--m": `${MORPH_MS}ms`,
            "--f": `${FADE_OUT_MS}ms`,
            boxShadow: "0 1px 2px rgba(12,38,77,0.06), 0 8px 24px rgba(12,38,77,0.08)",
            transitionProperty: "width, height, border-radius",
            transitionDuration: "var(--m)",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          } as React.CSSProperties
        }
      >
        <RimGlow layers={layers} />

        {}
        {}
        <div
          className="relative h-full w-full overflow-hidden"
          style={{
            borderRadius: "calc(var(--r) - 1px)",
            backgroundColor: DARK_KEYS.has(variant.key)
              ? "#1e1e1e"
              : "var(--s-surface-2)",
            transitionProperty: "background-color",
            transitionDuration: "var(--m)",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {}
          <Surface dark={DARK_KEYS.has(variant.key)} />

          <div
            key={gen}

            className={`relative h-full w-full ${variant.pad}`}
            style={
              {
                opacity: showing ? 1 : 0,
                contentVisibility: morphing ? "hidden" : undefined,
                transitionProperty: "opacity",
                transitionDuration: "var(--f)",
                transitionTimingFunction: "ease-out",
                display: "flex",
                alignItems: "center",
                height: "100%",
              } as React.CSSProperties
            }
          >
            {}
            <variant.Content />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiLightsCard;
