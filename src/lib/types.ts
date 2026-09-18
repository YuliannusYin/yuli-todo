export type AppView = "board" | "scheduled" | "archive" | "reports" | "settings";

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
  font_size: number;
};

export type SettingsPatch = {
  archive_after_days?: number;
  locale?: LocaleId;
  theme_id?: ThemeId;
  color_scheme?: ColorScheme;
  font_size?: number;
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
  in_use: boolean;
};

export type Tag = {
  id: string;
  name: string;
};

export type Task = {
  id: string;
  name: string;
  type_id: string | null;
  type_name: string | null;
  content: string;
  notes: string;
  tags: Tag[];
  start_at: string | null;
  end_at: string | null;
  status: TaskStatus;
  board_column: BoardColumn | null;
  doing_elapsed_seconds: number;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskWrite = {
  name: string;
  type_id: string | null;
  content: string;
  notes: string;
  tags: string[];
  start_at: string | null;
  end_at: string | null;
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

export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 18;

export const DEFAULT_SETTINGS: Settings = {
  archive_after_days: 3,
  locale: "en",
  theme_id: "metal",
  color_scheme: "system",
  font_size: 13,
};
