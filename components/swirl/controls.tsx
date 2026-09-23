"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Shared playground control primitives (this repo has no Tailwind, so these are
 * styled inline). API matches the source project's swirl/controls.
 */

export const PG_PREVIEW: string = "pg-preview";
export const PG_PANEL: string = "pg-panel";

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 32,
        width: "100%",
        borderRadius: 8,
        border: "1px solid var(--border-line)",
        background: "#17171b",
        padding: "0 12px",
        fontSize: 12,
        color: "#9aa",
        boxSizing: "border-box",
      }}
    >
      <span style={{ flexShrink: 0 }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, minWidth: 0, accentColor: "#eee" }}
      />
      <span
        style={{
          flexShrink: 0,
          color: "#eee",
          fontVariantNumeric: "tabular-nums",
          minWidth: 34,
          textAlign: "right",
        }}
      >
        {format ? format(value) : String(value)}
      </span>
    </label>
  );
}

export function SegmentedControl({
  options,
  activeId,
  onPick,
  fill = false,
}: {
  options: { id: string; label: string }[];
  activeId: string;
  onPick: (id: string) => void;
  fill?: boolean;
}) {
  void fill;
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: 4,
        borderRadius: 10,
        border: "1px solid var(--border-line)",
        background: "#17171b",
        width: "fit-content",
      }}
    >
      {options.map((o) => {
        const active = o.id === activeId;
        return (
          <button
            key={o.id}
            onClick={() => onPick(o.id)}
            style={{
              fontSize: 12,
              padding: "6px 14px",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              background: active ? "#eee" : "transparent",
              color: active ? "#111" : "#9aa",
              fontWeight: active ? 600 : 400,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function GhostButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 12,
        padding: "4px 12px",
        borderRadius: 999,
        border: "1px solid var(--border-line)",
        background: "transparent",
        color: "#eee",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export const PREVIEW_STYLE: CSSProperties = {
  position: "relative",
  aspectRatio: "16 / 9",
  width: "100%",
  overflow: "hidden",
  borderRadius: 12,
  border: "1px solid var(--border-line)",
  background: "#111",
};

export const PANEL_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  marginTop: 10,
};

export function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 32,
        width: "100%",
        borderRadius: 8,
        border: "1px solid var(--border-line)",
        background: "#17171b",
        padding: "0 10px",
        fontSize: 12,
        color: "#9aa",
        boxSizing: "border-box",
        cursor: "pointer",
      }}
    >
      <span style={{ flexShrink: 0 }}>{label}</span>
      <span style={{ flex: 1 }} />
      <span
        style={{
          fontFamily: "var(--font-neue-mono, monospace)",
          color: "#eee",
          fontVariantNumeric: "tabular-nums",
          textTransform: "uppercase",
        }}
      >
        {value}
      </span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 24, height: 24, border: "none", padding: 0, background: "none", cursor: "pointer" }}
      />
    </label>
  );
}

export function Select({
  activeId,
  onPick,
  options,
  ariaLabel,
}: {
  activeId: string;
  onPick: (id: string) => void;
  options: { id: string; label: string }[];
  ariaLabel?: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={activeId}
      onChange={(e) => onPick(e.target.value)}
      style={{
        width: "100%",
        height: 32,
        borderRadius: 8,
        border: "1px solid var(--border-line)",
        background: "#17171b",
        color: "#eee",
        fontSize: 12,
        padding: "0 10px",
        cursor: "pointer",
      }}
    >
      {options.map((o) => (
        <option key={o.id} value={o.id} style={{ color: "#eee", background: "#17171b" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
