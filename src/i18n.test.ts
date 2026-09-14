import { describe, expect, it } from "vitest";
import en from "../locales/en.json";
import zhCN from "../locales/zh-CN.json";
import { translate } from "./i18n";

describe("i18n catalogs", () => {
  it("keeps English and Chinese keys in lockstep", () => {
    const enKeys = Object.keys(en).sort();
    const zhKeys = Object.keys(zhCN).sort();
    expect(zhKeys).toEqual(enKeys);
  });

  it("falls back to English and replaces placeholders", () => {
    expect(translate("zh-CN", "missing.key")).toBe("missing.key");
    expect(translate("en", "error.storage.path", { path: "C:\\data.sqlite" })).toBe(
      "Data file: C:\\data.sqlite",
    );
  });
});
