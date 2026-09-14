import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useApp } from "../context/AppContext";
import styles from "./WindowControls.module.css";

export function WindowControls() {
  const { t } = useApp();
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;

    void (async () => {
      try {
        const win = getCurrentWindow();
        const sync = async () => {
          const next = await win.isMaximized();
          if (!cancelled) {
            setMaximized(next);
          }
        };
        await sync();
        const stop = await win.onResized(() => {
          void sync();
        });
        if (cancelled) {
          stop();
          return;
        }
        unlisten = stop;
      } catch {
        // Browser preview / tests have no Tauri window.
      }
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  async function run(action: "minimize" | "toggleMaximize" | "close") {
    try {
      const win = getCurrentWindow();
      if (action === "minimize") {
        await win.minimize();
        return;
      }
      if (action === "toggleMaximize") {
        await win.toggleMaximize();
        setMaximized(await win.isMaximized());
        return;
      }
      await win.close();
    } catch {
      // Ignore when the webview is not hosted by Tauri.
    }
  }

  return (
    <div className={styles.group}>
      <button
        type="button"
        className={styles.btn}
        aria-label={t("window.minimize")}
        title={t("window.minimize")}
        onClick={() => void run("minimize")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M19 13H5v-2h14z" />
        </svg>
      </button>
      <button
        type="button"
        className={styles.btn}
        aria-label={maximized ? t("window.restore") : t("window.maximize")}
        title={maximized ? t("window.restore") : t("window.maximize")}
        onClick={() => void run("toggleMaximize")}
      >
        {maximized ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M4 8h12v12H4zm2 4v8h8v-8zM8 4h12v12h-2V8H8z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M4 4h16v16H4zm2 4v10h12V8z" />
          </svg>
        )}
      </button>
      <button
        type="button"
        className={`${styles.btn} ${styles.close}`}
        aria-label={t("window.close")}
        title={t("window.close")}
        onClick={() => void run("close")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M13.46 12L19 17.54V19h-1.46L12 13.46L6.46 19H5v-1.46L10.54 12L5 6.46V5h1.46L12 10.54L17.54 5H19v1.46z"
          />
        </svg>
      </button>
    </div>
  );
}
