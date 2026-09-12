import { TaskCard } from "../components/TaskCard";
import { useApp } from "../context/AppContext";
import { useTasks } from "../context/TaskContext";
import styles from "./ArchiveView.module.css";

export function ArchiveView() {
  const { t, settings } = useApp();
  const { archive } = useTasks();
  return (
    <div className={styles.page}>
      {archive.length === 0 ? (
        <p className={styles.empty}>{t("archive.empty")}</p>
      ) : (
        archive.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            locale={settings.locale}
            t={t}
            onOpen={() => undefined}
          />
        ))
      )}
    </div>
  );
}
