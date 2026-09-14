import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { TitleBar } from "../components/TitleBar";
import { useApp } from "../context/AppContext";
import { getStorageInfo } from "../lib/ipc";
import type { CommandError } from "../lib/types";
import styles from "./StorageErrorView.module.css";

export function StorageErrorView({ error }: { error: CommandError }) {
  const { t } = useApp();
  const [path, setPath] = useState(error.path ?? "");

  useEffect(() => {
    if (error.path) {
      setPath(error.path);
      return;
    }
    void getStorageInfo()
      .then((info) => setPath(info.path))
      .catch(() => undefined);
  }, [error.path]);

  return (
    <div className={styles.frame}>
      <TitleBar />
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>{t("error.storage.title")}</h1>
          <p>{t(error.messageKey)}</p>
          {path ? <p className={styles.path}>{t("error.storage.path", { path })}</p> : null}
          <button
            type="button"
            className={styles.quit}
            onClick={() => void getCurrentWindow().close()}
          >
            {t("error.storage.quit")}
          </button>
        </div>
      </div>
    </div>
  );
}
