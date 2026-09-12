import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useTasks } from "../context/TaskContext";
import { THEME_IDS, type ColorScheme, type LocaleId } from "../lib/types";
import styles from "./SettingsView.module.css";

const SCHEMES: ColorScheme[] = ["light", "dark", "system"];

export function SettingsView() {
  const { t, settings, patchSettings } = useApp();
  const { types, addType, editType, removeType } = useTasks();
  const [newType, setNewType] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <h2 className={styles.heading}>{t("settings.archive.title")}</h2>
        <label className={styles.label}>
          {t("settings.archive.afterDays")}
          <input
            className={styles.input}
            type="number"
            min={0}
            max={365}
            value={settings.archive_after_days}
            disabled
          />
        </label>
        <p className={styles.helper}>{t("settings.archive.helper")}</p>
        <p className={styles.hint}>{t("settings.archive.disabledHint")}</p>
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
        <div className={styles.label}>{t("settings.appearance.scheme")}</div>
        <div className={styles.schemes}>
          {SCHEMES.map((scheme) => (
            <button
              key={scheme}
              type="button"
              className={styles.schemeBtn}
              data-active={settings.color_scheme === scheme ? true : undefined}
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
                onClick={() =>
                  void editType(type.id, drafts[type.id] ?? type.name).then(() =>
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
  );
}
