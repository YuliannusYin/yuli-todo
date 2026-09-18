import { describe, expect, it } from "vitest";
import {
  addLocalDays,
  formatDuration,
  lastDayOfLocalMonth,
  localDayKey,
  parseLocalDateKey,
  startOfIsoWeek,
  startOfLocalMonth,
  startOfLocalYear,
} from "./datetime";

describe("formatDuration", () => {
  it("formats English units without seconds", () => {
    expect(formatDuration(0, "en")).toBe("0m");
    expect(formatDuration(59, "en")).toBe("0m");
    expect(formatDuration(45 * 60, "en")).toBe("45m");
    expect(formatDuration(2 * 3600, "en")).toBe("2h");
    expect(formatDuration(2 * 3600 + 3 * 60, "en")).toBe("2h 3m");
    expect(formatDuration(24 * 3600 + 4 * 3600, "en")).toBe("1d 4h");
  });

  it("formats Chinese units without seconds", () => {
    expect(formatDuration(0, "zh-CN")).toBe("0分");
    expect(formatDuration(59, "zh-CN")).toBe("0分");
    expect(formatDuration(45 * 60, "zh-CN")).toBe("45分");
    expect(formatDuration(2 * 3600, "zh-CN")).toBe("2小时");
    expect(formatDuration(2 * 3600 + 3 * 60, "zh-CN")).toBe("2小时3分");
    expect(formatDuration(24 * 3600 + 4 * 3600, "zh-CN")).toBe("1天4小时");
  });
});

describe("local calendar helpers", () => {
  it("starts ISO weeks on Monday including Sunday leftovers", () => {
    expect(localDayKey(startOfIsoWeek(new Date(2026, 8, 16, 15, 0, 0)))).toBe("2026-09-14");
    expect(localDayKey(startOfIsoWeek(new Date(2026, 8, 14, 0, 0, 0)))).toBe("2026-09-14");
    expect(localDayKey(startOfIsoWeek(new Date(2026, 8, 20, 23, 0, 0)))).toBe("2026-09-14");
    expect(localDayKey(addLocalDays(startOfIsoWeek(new Date(2026, 8, 16)), 6))).toBe("2026-09-20");
  });

  it("parses and rejects calendar keys", () => {
    expect(parseLocalDateKey("2026-09-16")?.getDate()).toBe(16);
    expect(parseLocalDateKey("2026-02-30")).toBeNull();
    expect(parseLocalDateKey("16-09-2026")).toBeNull();
  });

  it("finds month and year bounds", () => {
    const mid = new Date(2026, 8, 16);
    expect(localDayKey(startOfLocalMonth(mid))).toBe("2026-09-01");
    expect(localDayKey(lastDayOfLocalMonth(mid))).toBe("2026-09-30");
    expect(localDayKey(startOfLocalYear(mid))).toBe("2026-01-01");
  });
});
