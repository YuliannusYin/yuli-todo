import { useApp } from "../context/AppContext";
import { THEME_IDS, type ColorScheme, type LocaleId } from "../lib/types";
import styles from "./SettingsView.module.css";

const SCHEMES: ColorScheme[] = ["light", "dark", "system"];

export function SettingsView() {
  const { t, settings, patchSettings } = useApp();

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
          <div className={styles.typeRow}>
            <input className={styles.input} disabled placeholder={t("settings.types.placeholder")} />
            <button type="button" className={styles.schemeBtn} disabled>
              {t("settings.types.add")}
            </button>
          </div>
        </div>
        <p className={styles.hint}>{t("settings.types.disabledHint")}</p>
      </section>
    </div>
  );
}
