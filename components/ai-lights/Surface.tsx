"use client";

/**
 * The variant face's surface detail: a quiet top-lit sheen so the panel reads
 * as a physical surface rather than a flat colour. Dark variants (the inverted
 * terminal) get a much weaker highlight off the same rule.
 */
export function Surface({ dark = false }: { dark?: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        pointerEvents: "none",
        background: dark
          ? "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 40%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 45%)",
      }}
    />
  );
}
