"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationTheme } from "../lib/animation-theme";

type CopyState = "idle" | "copying" | "copied" | "error";

export default function CopySourceButton({ entry, title, theme }: { entry: string; title: string; theme: AnimationTheme }) {
  const [state, setState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const copy = async () => {
    setState("copying");
    if (resetTimer.current) clearTimeout(resetTimer.current);
    try {
      const source = fetch(`/api/component-source?entry=${encodeURIComponent(entry)}`, { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) throw new Error(`Source request failed: ${response.status}`);
          const text = await response.text();
          return `COLOR VALUES AT COPY TIME\nsetAnimationTheme(${JSON.stringify(theme, null, 2)});\n\n${text}`;
        });

      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ "text/plain": source.then((text) => new Blob([text], { type: "text/plain" })) }),
        ]);
      } else {
        await navigator.clipboard.writeText(await source);
      }
      setState("copied");
    } catch (error) {
      console.error("Could not copy component source", error);
      setState("error");
    }
    resetTimer.current = setTimeout(() => setState("idle"), 2400);
  };

  const label = state === "copying" ? "Copying…" : state === "copied" ? "Copied!" : state === "error" ? "Copy failed" : "Copy code";
  return (
    <button
      type="button"
      className="copy-source-button"
      onClick={copy}
      disabled={state === "copying"}
      aria-label={`${label}: ${title}`}
      title={`Copy ${title} and its source files`}
    >
      <span aria-live="polite">{label}</span>
    </button>
  );
}
