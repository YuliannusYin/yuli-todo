import { invoke } from "@tauri-apps/api/core";
import type { Settings, SettingsPatch } from "./types";

export function getSettings() {
  return invoke<Settings>("get_settings");
}

export function updateSettings(patch: SettingsPatch) {
  return invoke<Settings>("update_settings", { patch });
}

export function getStorageInfo() {
  return invoke<{ path: string }>("get_storage_info");
}
