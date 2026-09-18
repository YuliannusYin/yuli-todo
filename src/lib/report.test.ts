import { describe, expect, it } from "vitest";
import { localDayKey, startOfIsoWeek } from "./datetime";
import {
  NONE_ID,
  OTHER_ID,
  boardWip,
  buildReport,
  enumerateBuckets,
  resolvePeriod,
  shareOf,
  typeComparison,
} from "./report";
import type { Task, TaskStatus } from "./types";

const NOW = new Date(2026, 8, 16, 15, 30, 0);

function task(partial: Partial<Task> & Pick<Task, "id" | "status">): Task {
  return {
    name: partial.name ?? partial.id,
    type_id: partial.type_id ?? null,
    type_name: partial.type_name ?? null,
    content: "",
    notes: "",
    tags: partial.tags ?? [],
    start_at: null,
    end_at: null,
    board_column: partial.board_column ?? null,
    doing_elapsed_seconds: partial.doing_elapsed_seconds ?? 0,
    completed_at: partial.completed_at ?? null,
    archived_at: partial.archived_at ?? null,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    ...partial,
  };
}

function localIso(year: number, month: number, day: number, hour = 14): string {
  return new Date(year, month - 1, day, hour, 0, 0).toISOString();
}

describe("resolvePeriod", () => {
  it("uses Monday through Sunday for this week", () => {
    const range = resolvePeriod("week", NOW);
    expect(range).toEqual({
      fromKey: "2026-09-14",
      toKey: "2026-09-20",
      granularity: "day",
    });
    expect(localDayKey(startOfIsoWeek(NOW))).toBe("2026-09-14");
    expect(localDayKey(startOfIsoWeek(new Date(2026, 8, 20, 9, 0, 0)))).toBe("2026-09-14");
    expect(localDayKey(startOfIsoWeek(new Date(2026, 8, 14, 0, 0, 0)))).toBe("2026-09-14");
  });

  it("covers the current month and year", () => {
    expect(resolvePeriod("month", NOW)).toEqual({
      fromKey: "2026-09-01",
      toKey: "2026-09-30",
      granularity: "day",
    });
    expect(resolvePeriod("year", NOW)).toEqual({
      fromKey: "2026-01-01",
      toKey: "2026-12-31",
      granularity: "month",
    });
  });

  it("swaps inverted custom dates and picks granularity by span", () => {
    expect(resolvePeriod("custom", NOW, "2026-09-20", "2026-09-18")).toEqual({
      fromKey: "2026-09-18",
      toKey: "2026-09-20",
      granularity: "day",
    });
    expect(resolvePeriod("custom", NOW, "2026-08-01", "2026-09-30").granularity).toBe("week");
    expect(resolvePeriod("custom", NOW, "2025-01-01", "2026-12-31").granularity).toBe("month");
  });

  it("falls back to this week when custom dates are empty", () => {
    expect(resolvePeriod("custom", NOW, "", "")).toEqual(resolvePeriod("week", NOW));
  });
});

describe("enumerateBuckets", () => {
  it("includes future days of the current week", () => {
    const keys = enumerateBuckets(resolvePeriod("week", NOW));
    expect(keys).toEqual([
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
      "2026-09-18",
      "2026-09-19",
      "2026-09-20",
    ]);
  });

  it("emits twelve month keys for a year", () => {
    const keys = enumerateBuckets(resolvePeriod("year", NOW));
    expect(keys).toHaveLength(12);
    expect(keys[0]).toBe("2026-01");
    expect(keys[11]).toBe("2026-12");
  });
});

describe("buildReport", () => {
  const week = resolvePeriod("week", NOW);

  it("counts completions in range, including Done still on the board", () => {
    const tasks = [
      task({
        id: "in-week-board",
        status: "done",
        board_column: "done",
        completed_at: localIso(2026, 9, 16),
        doing_elapsed_seconds: 120,
      }),
      task({
        id: "in-week-archive",
        status: "force_ended",
        completed_at: localIso(2026, 9, 14, 8),
        archived_at: localIso(2026, 9, 14, 8),
        doing_elapsed_seconds: 60,
      }),
      task({
        id: "outside",
        status: "done",
        completed_at: localIso(2026, 9, 13),
        archived_at: localIso(2026, 9, 13),
        doing_elapsed_seconds: 999,
      }),
      task({
        id: "active",
        status: "doing",
        board_column: "doing",
        doing_elapsed_seconds: 400,
      }),
    ];
    const report = buildReport(tasks, week);
    expect(report.completedCount).toBe(2);
    expect(report.durationSeconds).toBe(180);
    expect(report.doneCount).toBe(1);
    expect(report.forceEndedCount).toBe(1);
    expect(report.trend.find((point) => point.key === "2026-09-16")?.count).toBe(1);
    expect(report.trend.find((point) => point.key === "2026-09-13")).toBeUndefined();
    expect(report.trend.find((point) => point.key === "2026-09-20")?.count).toBe(0);
  });

  it("ignores tasks without completed_at even if archived", () => {
    const report = buildReport(
      [
        task({
          id: "no-stamp",
          status: "to_do" as TaskStatus,
          archived_at: localIso(2026, 9, 16),
        }),
      ],
      week,
    );
    expect(report.completedCount).toBe(0);
  });

  it("adds type rows and overlaps tag duration", () => {
    const tasks = [
      task({
        id: "typed",
        status: "done",
        type_id: "work",
        type_name: "Work",
        tags: [
          { id: "a", name: "alpha" },
          { id: "b", name: "beta" },
        ],
        completed_at: localIso(2026, 9, 15),
        doing_elapsed_seconds: 100,
      }),
      task({
        id: "untyped",
        status: "belated",
        completed_at: localIso(2026, 9, 16),
        doing_elapsed_seconds: 50,
      }),
    ];
    const report = buildReport(tasks, week);
    expect(report.types.map((row) => [row.id, row.count, row.durationSeconds])).toEqual([
      ["work", 1, 100],
      [NONE_ID, 1, 50],
    ]);
    expect(report.completedCount).toBe(2);
    expect(report.durationSeconds).toBe(150);
    expect(report.belatedCount).toBe(1);
    const tagDurations = report.tags.reduce((sum, row) => sum + row.durationSeconds, 0);
    expect(tagDurations).toBe(250);
    expect(report.tags.find((row) => row.id === NONE_ID)?.durationSeconds).toBe(50);
  });
});

describe("boardWip", () => {
  it("counts columns and overdue independently of completed_at", () => {
    const wip = boardWip([
      task({ id: "t1", status: "to_do", board_column: "todo" }),
      task({ id: "t2", status: "overdue", board_column: "todo" }),
      task({ id: "d1", status: "doing", board_column: "doing" }),
      task({
        id: "done",
        status: "done",
        board_column: "done",
        completed_at: localIso(2026, 9, 16),
      }),
    ]);
    expect(wip).toEqual({ todo: 2, doing: 1, overdue: 1 });
  });
});

describe("typeComparison", () => {
  it("folds overflow types into Other", () => {
    const rows = Array.from({ length: 10 }, (_, index) => ({
      id: `t${index}`,
      name: `T${index}`,
      count: 10 - index,
      durationSeconds: 10 - index,
    }));
    const compared = typeComparison(rows, 8);
    expect(compared).toHaveLength(9);
    expect(compared[8]).toMatchObject({ id: OTHER_ID, count: 3, durationSeconds: 3 });
  });
});

describe("shareOf", () => {
  it("rounds a count against the period total", () => {
    expect(shareOf(1, 3)).toBe("33%");
    expect(shareOf(0, 0)).toBe("0%");
  });
});
