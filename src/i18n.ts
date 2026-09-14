import en from "../locales/en.json";
import zhCN from "../locales/zh-CN.json";
import type { LocaleId } from "./lib/types";

const catalogs: Record<LocaleId, Record<string, string>> = {
  en: en as Record<string, string>,
  "zh-CN": zhCN as Record<string, string>,
};

export function translate(
  locale: LocaleId,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const table = catalogs[locale] ?? catalogs.en;
  let template = table[key] ?? catalogs.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      template = template.replaceAll(`{${name}}`, String(value));
    }
  }
  return template;
}
