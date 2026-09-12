import type { ColorScheme, ThemeId } from "./types";

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
