import type { LocaleId } from "./types";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function toUtcIso(localValue: string | null): string | null {
  if (!localValue) {
    return null;
  }
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setSeconds(0, 0);
  return date.toISOString();
}

export function toLocalInput(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateTime(iso: string, locale: LocaleId): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (locale === "zh-CN") {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${time}`;
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${time}`;
}

export function isFutureIso(iso: string, now = new Date()): boolean {
  return new Date(iso).getTime() > now.getTime();
}

export function startOfLocalDay(dateValue: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
}

export function endOfLocalDay(dateValue: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
}

export function formatDuration(totalSeconds: number, locale: LocaleId): string {
  const minutesTotal = Math.floor(Math.max(0, totalSeconds) / 60);
  if (minutesTotal < 1) {
    return locale === "zh-CN" ? "0分" : "0m";
  }
  const days = Math.floor(minutesTotal / (60 * 24));
  const hours = Math.floor((minutesTotal - days * 60 * 24) / 60);
  const minutes = minutesTotal % 60;
  if (locale === "zh-CN") {
    if (days) {
      return `${days}天${hours ? `${hours}小时` : ""}${minutes ? `${minutes}分` : ""}`;
    }
    if (hours) {
      return minutes ? `${hours}小时${minutes}分` : `${hours}小时`;
    }
    return `${minutes}分`;
  }
  if (days) {
    return [`${days}d`, hours ? `${hours}h` : null, minutes ? `${minutes}m` : null]
      .filter(Boolean)
      .join(" ");
  }
  if (hours) {
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}
