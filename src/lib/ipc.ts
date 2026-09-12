import { invoke } from "@tauri-apps/api/core";
import type { Settings, SettingsPatch, Task, TaskType, TaskWrite } from "./types";

export function getSettings() {
  return invoke<Settings>("get_settings");
}

export function updateSettings(patch: SettingsPatch) {
  return invoke<Settings>("update_settings", { patch });
}

export function getStorageInfo() {
  return invoke<{ path: string }>("get_storage_info");
}

export function listTasks(surface: "board" | "scheduled" | "archive") {
  return invoke<Task[]>("list_tasks", { surface });
}

export function getTask(id: string) {
  return invoke<Task>("get_task", { id });
}

export function createTask(payload: TaskWrite) {
  return invoke<Task>("create_task", { payload });
}

export function updateTask(id: string, payload: TaskWrite) {
  return invoke<Task>("update_task", { id, payload });
}

export function listTypes() {
  return invoke<TaskType[]>("list_types");
}

export function createType(name: string) {
  return invoke<TaskType>("create_type", { name });
}

export function renameType(id: string, name: string) {
  return invoke<TaskType>("rename_type", { id, name });
}

export function deleteType(id: string) {
  return invoke<void>("delete_type", { id });
}

export function moveTask(id: string, to_column: string) {
  return invoke<Task>("move_task", { id, to_column });
}

export function archiveNow(id: string) {
  return invoke<Task>("archive_now", { id });
}
