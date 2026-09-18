import type { ReactNode } from "react";
import { useApp } from "../context/AppContext";
import { useTasks } from "../context/TaskContext";
import type { AppView } from "../lib/types";
import { IconCheck } from "./icons";
import { TitleBar } from "./TitleBar";
import styles from "./AppShell.module.css";

const NAV: { id: AppView; key: string }[] = [
  { id: "board", key: "nav.board" },
  { id: "scheduled", key: "nav.scheduled" },
  { id: "archive", key: "nav.archive" },
  { id: "reports", key: "nav.reports" },
  { id: "settings", key: "nav.settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { view, setView, t } = useApp();
  const { toast } = useTasks();

  return (
    <div className={styles.shell}>
      <TitleBar>
        <nav className={styles.nav} aria-label={t("app.name")}>
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.navBtn}
              data-nav
              data-active={view === item.id ? true : undefined}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => setView(item.id)}
            >
              {t(item.key)}
            </button>
          ))}
        </nav>
      </TitleBar>
      <main className={styles.body}>{children}</main>
      {toast ? (
        <div className={styles.toast} role="status">
          <IconCheck size={15} />
          {toast}
        </div>
      ) : null}
    </div>
  );
}
