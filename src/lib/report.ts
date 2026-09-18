import {
  addLocalDays,
  daysInclusive,
  isoInLocalDateRange,
  isoLocalDayKey,
  lastDayOfLocalMonth,
  lastDayOfLocalYear,
  localDayKey,
  parseLocalDateKey,
  startOfIsoWeek,
  startOfLocalMonth,
  startOfLocalYear,
  yearMonthKey,
} from "./datetime";
import type { Task } from "./types";

export type PeriodKind = "week" | "month" | "year" | "custom";

export type BucketGranularity = "day" | "week" | "month";

export type ReportRange = {
  fromKey: string;
  toKey: string;
  granularity: BucketGranularity;
};

export type TrendPoint = {
  key: string;
  count: number;
};

export type BreakdownRow = {
  id: string;
  name: string;
  count: number;
  durationSeconds: number;
};

export type WipCounts = {
  todo: number;
  doing: number;
  overdue: number;
};

export type Report = {
  range: ReportRange;
  completedCount: number;
  durationSeconds: number;
  doneCount: number;
  belatedCount: number;
  forceEndedCount: number;
  trend: TrendPoint[];
  types: BreakdownRow[];
  tags: BreakdownRow[];
};

export const NONE_ID = "__none__";
export const OTHER_ID = "__other__";
export const TYPE_COMPARISON_LIMIT = 8;

const COMPLETED_STATUSES = new Set(["done", "belated", "force_ended"]);

export function resolvePeriod(
  kind: PeriodKind,
  now = new Date(),
  customFrom = "",
  customTo = "",
): ReportRange {
  if (kind === "week") {
    const start = startOfIsoWeek(now);
    return {
      fromKey: localDayKey(start),
      toKey: localDayKey(addLocalDays(start, 6)),
      granularity: "day",
    };
  }
  if (kind === "month") {
    return {
      fromKey: localDayKey(startOfLocalMonth(now)),
      toKey: localDayKey(lastDayOfLocalMonth(now)),
      granularity: "day",
    };
  }
  if (kind === "year") {
    return {
      fromKey: localDayKey(startOfLocalYear(now)),
      toKey: localDayKey(lastDayOfLocalYear(now)),
      granularity: "month",
    };
  }
  return customRange(customFrom, customTo, now);
}

function customRange(customFrom: string, customTo: string, now: Date): ReportRange {
  const week = resolvePeriod("week", now);
  const fromParsed = parseLocalDateKey(customFrom.trim());
  const toParsed = parseLocalDateKey(customTo.trim());
  let fromKey = fromParsed ? localDayKey(fromParsed) : week.fromKey;
  let toKey = toParsed ? localDayKey(toParsed) : week.toKey;
  if (fromKey > toKey) {
    const swap = fromKey;
    fromKey = toKey;
    toKey = swap;
  }
  const span = daysInclusive(fromKey, toKey) ?? 7;
  let granularity: BucketGranularity = "day";
  if (span > 366) {
    granularity = "month";
  } else if (span > 45) {
    granularity = "week";
  }
  return { fromKey, toKey, granularity };
}

export function enumerateBuckets(range: ReportRange): string[] {
  const from = parseLocalDateKey(range.fromKey);
  const to = parseLocalDateKey(range.toKey);
  if (!from || !to || range.fromKey > range.toKey) {
    return [];
  }
  const keys: string[] = [];
  if (range.granularity === "day") {
    for (let day = from; day.getTime() <= to.getTime(); day = addLocalDays(day, 1)) {
      keys.push(localDayKey(day));
    }
    return keys;
  }
  if (range.granularity === "week") {
    let week = startOfIsoWeek(from);
    const last = startOfIsoWeek(to);
    while (week.getTime() <= last.getTime()) {
      keys.push(localDayKey(week));
      week = addLocalDays(week, 7);
    }
    return keys;
  }
  let month = startOfLocalMonth(from);
  const lastMonth = startOfLocalMonth(to);
  while (month.getTime() <= lastMonth.getTime()) {
    keys.push(yearMonthKey(month));
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  }
  return keys;
}

export function bucketKeyForDate(date: Date, granularity: BucketGranularity): string {
  if (granularity === "day") {
    return localDayKey(date);
  }
  if (granularity === "week") {
    return localDayKey(startOfIsoWeek(date));
  }
  return yearMonthKey(date);
}

export function boardWip(board: Task[]): WipCounts {
  const counts: WipCounts = { todo: 0, doing: 0, overdue: 0 };
  for (const task of board) {
    if (task.archived_at) {
      continue;
    }
    if (task.board_column === "todo") {
      counts.todo += 1;
    } else if (task.board_column === "doing") {
      counts.doing += 1;
    }
    if (task.status === "overdue") {
      counts.overdue += 1;
    }
  }
  return counts;
}

function isCompletion(task: Task): boolean {
  return Boolean(task.completed_at) && COMPLETED_STATUSES.has(task.status);
}

function addBreakdown(
  map: Map<string, BreakdownRow>,
  id: string,
  name: string,
  durationSeconds: number,
) {
  const current = map.get(id);
  if (current) {
    current.count += 1;
    current.durationSeconds += durationSeconds;
    return;
  }
  map.set(id, { id, name, count: 1, durationSeconds });
}

function sortRows(rows: BreakdownRow[]): BreakdownRow[] {
  return [...rows].sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    if (a.id === NONE_ID && b.id !== NONE_ID) {
      return 1;
    }
    if (b.id === NONE_ID && a.id !== NONE_ID) {
      return -1;
    }
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });
}

export function buildReport(tasks: Task[], range: ReportRange): Report {
  const buckets = enumerateBuckets(range);
  const trendMap = new Map(buckets.map((key) => [key, 0]));
  const types = new Map<string, BreakdownRow>();
  const tags = new Map<string, BreakdownRow>();
  let completedCount = 0;
  let durationSeconds = 0;
  let doneCount = 0;
  let belatedCount = 0;
  let forceEndedCount = 0;

  for (const task of tasks) {
    if (!isCompletion(task) || !task.completed_at) {
      continue;
    }
    if (!isoInLocalDateRange(task.completed_at, range.fromKey, range.toKey)) {
      continue;
    }
    const completedDay = isoLocalDayKey(task.completed_at);
    if (!completedDay) {
      continue;
    }
    const completedDate = parseLocalDateKey(completedDay);
    if (!completedDate) {
      continue;
    }
    const duration = Math.max(0, task.doing_elapsed_seconds);
    completedCount += 1;
    durationSeconds += duration;
    if (task.status === "done") {
      doneCount += 1;
    } else if (task.status === "belated") {
      belatedCount += 1;
    } else if (task.status === "force_ended") {
      forceEndedCount += 1;
    }
    const key = bucketKeyForDate(completedDate, range.granularity);
    if (trendMap.has(key)) {
      trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }
    const typeId = task.type_id ?? NONE_ID;
    addBreakdown(types, typeId, task.type_name ?? "", duration);
    if (task.tags.length === 0) {
      addBreakdown(tags, NONE_ID, "", duration);
    } else {
      for (const tag of task.tags) {
        addBreakdown(tags, tag.id, tag.name, duration);
      }
    }
  }

  return {
    range,
    completedCount,
    durationSeconds,
    doneCount,
    belatedCount,
    forceEndedCount,
    trend: buckets.map((key) => ({ key, count: trendMap.get(key) ?? 0 })),
    types: sortRows([...types.values()]),
    tags: sortRows([...tags.values()]),
  };
}

export function typeComparison(rows: BreakdownRow[], limit = TYPE_COMPARISON_LIMIT): BreakdownRow[] {
  if (rows.length <= limit) {
    return rows;
  }
  const head = rows.slice(0, limit);
  const rest = rows.slice(limit);
  const other: BreakdownRow = {
    id: OTHER_ID,
    name: "",
    count: rest.reduce((sum, row) => sum + row.count, 0),
    durationSeconds: rest.reduce((sum, row) => sum + row.durationSeconds, 0),
  };
  return [...head, other];
}

export function shareOf(count: number, total: number): string {
  if (total <= 0) {
    return "0%";
  }
  return `${Math.round((count / total) * 100)}%`;
}
