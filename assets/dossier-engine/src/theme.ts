import type { CSSProperties } from "react";
import type { BrandTheme } from "./schema/types.js";

export type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

export function themeStyle(theme: BrandTheme): ThemeStyle {
  return {
    "--ink": theme.palette.ink,
    "--paper": theme.palette.paper,
    "--accent": theme.palette.accent,
    "--muted": theme.palette.muted,
    "--surface": theme.palette.surface,
    "--signal": theme.palette.signal,
    "--font-display": theme.typography.display,
    "--font-body": theme.typography.body,
    "--font-mono": theme.typography.mono,
    "--motif-stroke": `${theme.motif.strokeWidth}px`,
    "--motif-radius": `${theme.motif.cornerRadius}px`,
  };
}
