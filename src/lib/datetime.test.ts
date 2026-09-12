import { describe, expect, it } from "vitest";
import { formatDuration } from "./datetime";

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
