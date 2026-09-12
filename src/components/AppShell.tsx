import type { ReactNode } from "react";
import { useApp } from "../context/AppContext";
import type { AppView } from "../lib/types";
import styles from "./AppShell.module.css";

const NAV: { id: AppView; key: string }[] = [
  { id: "board", key: "nav.board" },
  { id: "scheduled", key: "nav.scheduled" },
  { id: "archive", key: "nav.archive" },
  { id: "settings", key: "nav.settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { view, setView, t } = useApp();

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <div className={styles.brand}>{t("app.name")}</div>
        <nav className={styles.nav} aria-label={t("app.name")}>
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.navBtn}
              data-nav
              data-active={view === item.id ? true : undefined}
              onClick={() => setView(item.id)}
            >
              {t(item.key)}
            </button>
          ))}
        </nav>
      </header>
      <main className={styles.body}>{children}</main>
    </div>
  );
}
