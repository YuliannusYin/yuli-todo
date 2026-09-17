import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { useTasks } from "../context/TaskContext";
import {
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  THEME_IDS,
  type ColorScheme,
  type LocaleId,
} from "../lib/types";
import styles from "./SettingsView.module.css";

const SCHEMES: ColorScheme[] = ["light", "dark", "system"];

export function SettingsView() {
  const { t, settings, patchSettings } = useApp();
  const { types, addType, editType, removeType } = useTasks();
  const [newType, setNewType] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [daysDraft, setDaysDraft] = useState(String(settings.archive_after_days));
  const [daysError, setDaysError] = useState<string | null>(null);

  useEffect(() => {
    setDaysDraft(String(settings.archive_after_days));
  }, [settings.archive_after_days]);

  function commitArchiveDays() {
    const parsed = Number(daysDraft);
    if (daysDraft.trim() === "" || !Number.isInteger(parsed) || parsed < 0 || parsed > 365) {
      setDaysError(t("error.validation.archiveDays"));
      setDaysDraft(String(settings.archive_after_days));
      return;
    }
    setDaysError(null);
    if (parsed !== settings.archive_after_days) {
      void patchSettings({ archive_after_days: parsed });
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
      <section className={styles.section}>
        <h2 className={styles.heading}>{t("settings.archive.title")}</h2>
        <label className={styles.label}>
          {t("settings.archive.afterDays")}
          <input
            className={styles.input}
            type="number"
            min={0}
            max={365}
            value={daysDraft}
            onChange={(event) => {
              setDaysDraft(event.target.value);
              setDaysError(null);
            }}
            onBlur={commitArchiveDays}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                (event.target as HTMLInputElement).blur();
              }
            }}
          />
        </label>
        <p className={styles.helper}>{t("settings.archive.helper")}</p>
        {daysError ? <p className={styles.error}>{daysError}</p> : null}
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{t("settings.appearance.title")}</h2>
        <div className={styles.label}>{t("settings.appearance.theme")}</div>
        <div className={styles.swatches}>
          {THEME_IDS.map((id) => (
            <button
              key={id}
              type="button"
              className={styles.swatch}
              data-swatch={id}
              data-active={settings.theme_id === id ? true : undefined}
              aria-pressed={settings.theme_id === id}
              onClick={() => void patchSettings({ theme_id: id })}
            >
              <span className={styles.split}>
                <span data-swatch-half="light" />
                <span data-swatch-half="dark" />
              </span>
              <span className={styles.caption}>{t(`theme.${id}`)}</span>
            </button>
          ))}
        </div>
        <div className={styles.label}>{t("settings.appearance.fontSize")}</div>
        <div className={styles.fontRow}>
          <input
            className={styles.slider}
            type="range"
            min={FONT_SIZE_MIN}
            max={FONT_SIZE_MAX}
            step={1}
            value={settings.font_size}
            aria-label={t("settings.appearance.fontSize")}
            aria-valuemin={FONT_SIZE_MIN}
            aria-valuemax={FONT_SIZE_MAX}
            aria-valuenow={settings.font_size}
            aria-valuetext={t("settings.appearance.fontSizeValue", { size: settings.font_size })}
            onChange={(event) => void patchSettings({ font_size: Number(event.target.value) })}
          />
          <span className={styles.fontValue}>
            {t("settings.appearance.fontSizeValue", { size: settings.font_size })}
          </span>
        </div>
        <p className={styles.helper}>{t("settings.appearance.fontSizeHelper")}</p>
        <div className={styles.label}>{t("settings.appearance.scheme")}</div>
        <div className={styles.schemes}>
          {SCHEMES.map((scheme) => (
            <button
              key={scheme}
              type="button"
              className={styles.schemeBtn}
              data-active={settings.color_scheme === scheme ? true : undefined}
              aria-pressed={settings.color_scheme === scheme}
              onClick={() => void patchSettings({ color_scheme: scheme })}
            >
              {t(`settings.appearance.${scheme}`)}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{t("settings.language.title")}</h2>
        <div className={styles.schemes}>
          {(["en", "zh-CN"] as LocaleId[]).map((locale) => (
            <button
              key={locale}
              type="button"
              className={styles.localeBtn}
              data-active={settings.locale === locale ? true : undefined}
              aria-pressed={settings.locale === locale}
              onClick={() => void patchSettings({ locale })}
            >
              {locale === "en" ? t("settings.language.en") : t("settings.language.zhCN")}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{t("settings.types.title")}</h2>
        <div className={styles.types}>
          {types.map((type) => (
            <div key={type.id} className={styles.typeRow}>
              <input
                className={styles.input}
                value={drafts[type.id] ?? type.name}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, [type.id]: event.target.value }))
                }
                maxLength={40}
              />
              <button
                type="button"
                className={styles.schemeBtn}
                disabled={
                  (drafts[type.id] ?? type.name).trim() === "" ||
                  (drafts[type.id] ?? type.name).trim() === type.name
                }
                onClick={() =>
                  void editType(type.id, (drafts[type.id] ?? type.name).trim()).then(() =>
                    setDrafts((current) => {
                      const next = { ...current };
                      delete next[type.id];
                      return next;
                    }),
                  )
                }
              >
                {t("settings.types.rename")}
              </button>
              <button
                type="button"
                className={styles.schemeBtn}
                disabled={type.in_use}
                onClick={() => void removeType(type.id)}
              >
                {t("settings.types.delete")}
              </button>
            </div>
          ))}
          <div className={styles.typeRow}>
            <input
              className={styles.input}
              value={newType}
              placeholder={t("settings.types.placeholder")}
              onChange={(event) => setNewType(event.target.value)}
              maxLength={40}
            />
            <button
              type="button"
              className={styles.schemeBtn}
              onClick={() => {
                if (!newType.trim()) {
                  return;
                }
                void addType(newType).then(() => setNewType(""));
              }}
            >
              {t("settings.types.add")}
            </button>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
