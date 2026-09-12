import { getCurrentWindow } from "@tauri-apps/api/window";
import { useApp } from "../context/AppContext";
import type { CommandError } from "../lib/types";
import styles from "./StorageErrorView.module.css";

export function StorageErrorView({ error }: { error: CommandError }) {
  const { t } = useApp();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t("error.storage.title")}</h1>
        <p>{t(error.messageKey)}</p>
        {error.path ? <p className={styles.path}>{error.path}</p> : null}
        <button
          type="button"
          className={styles.quit}
          onClick={() => void getCurrentWindow().close()}
        >
          {t("error.storage.quit")}
        </button>
      </div>
    </div>
  );
}
