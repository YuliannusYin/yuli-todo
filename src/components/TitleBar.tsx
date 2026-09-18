import type { MouseEvent, ReactNode } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useApp } from "../context/AppContext";
import { WindowControls } from "./WindowControls";
import styles from "./TitleBar.module.css";

export function TitleBar({ children }: { children?: ReactNode }) {
  const { t } = useApp();

  function onMouseDown(event: MouseEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }
    if ((event.target as HTMLElement | null)?.closest("button")) {
      return;
    }
    void (async () => {
      try {
        const win = getCurrentWindow();
        if (event.detail === 2) {
          await win.toggleMaximize();
          return;
        }
        await win.startDragging();
      } catch {
        // Browser preview has no Tauri window.
      }
    })();
  }

  return (
    <header className={styles.bar} onMouseDown={onMouseDown}>
      <div className={styles.brand}>
        <span className={styles.mark} data-brand-mark aria-hidden="true">
          Y
        </span>
        <span className={styles.wordmark}>{t("app.name")}</span>
      </div>
      {children}
      <div className={styles.spacer} />
      <WindowControls />
    </header>
  );
}
