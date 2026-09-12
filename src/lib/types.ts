export type AppView = "board" | "scheduled" | "archive" | "settings";

export type ThemeId = "metal" | "claude" | "vscode" | "github" | "tiktok";

export type ColorScheme = "light" | "dark" | "system";

export type LocaleId = "en" | "zh-CN";

export type TaskStatus =
  | "will_do"
  | "to_do"
  | "doing"
  | "done"
  | "overdue"
  | "belated"
  | "force_ended";

export type BoardColumn = "todo" | "doing" | "done";

export type Settings = {
  archive_after_days: number;
  locale: LocaleId;
  theme_id: ThemeId;
  color_scheme: ColorScheme;
};

export type SettingsPatch = {
  archive_after_days?: number;
  locale?: LocaleId;
  theme_id?: ThemeId;
  color_scheme?: ColorScheme;
};

export type CommandError = {
  code: string;
  messageKey: string;
  path?: string;
};

export type TaskType = {
  id: string;
  name: string;
  sort_order: number;
};

export type TaskDraft = {
  name: string;
  type_id: string | null;
  content: string;
  notes: string;
  tags: string[];
  start_at: string | null;
  end_at: string | null;
};

export const THEME_IDS: ThemeId[] = ["metal", "claude", "vscode", "github", "tiktok"];

export const DEFAULT_SETTINGS: Settings = {
  archive_after_days: 3,
  locale: "en",
  theme_id: "metal",
  color_scheme: "system",
};
