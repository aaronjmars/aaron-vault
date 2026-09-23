/**
 * Glyph metrics for the design-tiles engine. The engine draws each word into
 * one SVG whose viewBox is fixed at REF units; we measure per-glyph rects with
 * canvas measureText (advance width + ink box) so tiles can pack edge to edge.
 */

export const REF_FS = 100;

export const BASELINE_Y = 120;

export interface GlyphMetric {
  ch: string;
  x: number;
  w: number;
  top: number;
  bottom: number;
}

export interface WordMetrics {
  width: number;
  glyphs: GlyphMetric[];
}

let scratch: CanvasRenderingContext2D | null = null;

function ctxFor(): CanvasRenderingContext2D {
  if (!scratch) {
    const c = document.createElement("canvas");
    c.width = 8;
    c.height = 8;
    scratch = c.getContext("2d")!;
  }
  return scratch;
}

export function measureWord(
  word: string,
  fontFamily: string,
  weight = "500",
): WordMetrics | null {
  if (typeof document === "undefined") return null;
  const ctx = ctxFor();
  ctx.font = `${weight} ${REF_FS}px ${fontFamily}`;
  const glyphs: GlyphMetric[] = [];
  let x = 0;
  for (const ch of word) {
    const m = ctx.measureText(ch);
    const asc = m.actualBoundingBoxAscent;
    const desc = m.actualBoundingBoxDescent;
    if (asc === undefined || desc === undefined) return null;
    glyphs.push({
      ch,
      x,
      w: m.width,
      top: BASELINE_Y - asc,
      bottom: BASELINE_Y + desc,
    });
    x += m.width;
  }
  return { width: x, glyphs };
}
