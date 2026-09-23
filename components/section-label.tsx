"use client";

import type { ReactNode } from "react";

export function SectionLabel({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#9aa",
        }}
      >
        {children}
      </span>
      {action ? <div style={{ marginLeft: "auto" }}>{action}</div> : null}
    </div>
  );
}
