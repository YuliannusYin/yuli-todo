import { AppProvider, useApp } from "./context/AppContext";
import { TaskProvider } from "./context/TaskContext";
import { AppShell } from "./components/AppShell";
import { TitleBar } from "./components/TitleBar";
import { ArchiveView } from "./views/ArchiveView";
import { BoardView } from "./views/BoardView";
import { ReportsView } from "./views/ReportsView";
import { ScheduledView } from "./views/ScheduledView";
import { SettingsView } from "./views/SettingsView";
import { StorageErrorView } from "./views/StorageErrorView";
import styles from "./App.module.css";

function Shell() {
  const { loading, storageError, view } = useApp();

  if (loading) {
    return (
      <div className={styles.frame}>
        <TitleBar />
        <div className={styles.pulse} aria-hidden="true">
          <div className={styles.bar} />
        </div>
      </div>
    );
  }

  if (storageError) {
    return <StorageErrorView error={storageError} />;
  }

  return (
    <TaskProvider>
      <AppShell>
        {view === "board" ? <BoardView /> : null}
        {view === "scheduled" ? <ScheduledView /> : null}
        {view === "archive" ? <ArchiveView /> : null}
        {view === "reports" ? <ReportsView /> : null}
        {view === "settings" ? <SettingsView /> : null}
      </AppShell>
    </TaskProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
