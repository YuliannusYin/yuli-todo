import { FONT_SIZE_MAX, FONT_SIZE_MIN, type ColorScheme, type ThemeId } from "./types";

export function resolveScheme(colorScheme: ColorScheme): "light" | "dark" {
  if (colorScheme !== "system") {
    return colorScheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(themeId: ThemeId, colorScheme: ColorScheme) {
  const root = document.documentElement;
  root.dataset.theme = themeId;
  root.dataset.scheme = resolveScheme(colorScheme);
}

export function applyFontSize(fontSize: number) {
  const size = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(fontSize)));
  document.documentElement.style.fontSize = `${size}px`;
}
