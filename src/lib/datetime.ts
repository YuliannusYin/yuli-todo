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

export function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dayDiffFromToday(iso: string, now = new Date()): number {
  const date = new Date(iso);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((day - today) / 86_400_000);
}

export function formatDayHeader(iso: string, locale: LocaleId): string {
  const date = new Date(iso);
  const formatter = new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return formatter.format(date);
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

export function parseLocalDateKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function cloneLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function startOfIsoWeek(date: Date): Date {
  const day = cloneLocalDay(date);
  const weekday = day.getDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  return addLocalDays(day, -offset);
}

export function startOfLocalMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfLocalYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

export function lastDayOfLocalMonth(date: Date): Date {
  return addLocalDays(new Date(date.getFullYear(), date.getMonth() + 1, 1), -1);
}

export function lastDayOfLocalYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31);
}

export function yearMonthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function isoLocalDayKey(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return localDayKey(date);
}

export function isoInLocalDateRange(iso: string, fromKey: string, toKey: string): boolean {
  const key = isoLocalDayKey(iso);
  if (!key) {
    return false;
  }
  return key >= fromKey && key <= toKey;
}

export function daysInclusive(fromKey: string, toKey: string): number | null {
  const from = parseLocalDateKey(fromKey);
  const to = parseLocalDateKey(toKey);
  if (!from || !to) {
    return null;
  }
  return Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
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
