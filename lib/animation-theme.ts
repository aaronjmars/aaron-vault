/** Shared, optional source colors for every study. Each renderer resolves these
 * values before drawing; no card-level CSS filter or overlay is involved. */
export type AnimationTheme = {
  foreground?: string;
  background?: string;
  accent?: string;
};

export type ColorRole = keyof AnimationTheme;

let activeTheme: AnimationTheme = {};

export function setAnimationTheme(theme: AnimationTheme) {
  activeTheme = { ...theme };
}

export function getAnimationTheme(): Readonly<AnimationTheme> {
  return activeTheme;
}

export function themeColor(role: ColorRole, original: string): string {
  return activeTheme[role] || original;
}

export function themePaint<T extends string | CanvasGradient | CanvasPattern>(role: ColorRole, original: T): string | T {
  return activeTheme[role] || original;
}

export function themeRgb(role: ColorRole, original: readonly number[], unit = 255): [number, number, number] {
  const value = activeTheme[role];
  if (!value) return [original[0], original[1], original[2]];
  const hex = value.slice(1);
  return [0, 2, 4].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255) * unit) as [number, number, number];
}

export function themeRgbCss(role: ColorRole, original: readonly number[]): string {
  const rgb = themeRgb(role, original);
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
