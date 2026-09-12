import { useState } from "react";
import { Dialog } from "../components/Dialog";
import { TaskForm } from "../components/TaskForm";
import { useApp } from "../context/AppContext";
import type { TaskDraft } from "../lib/types";
import styles from "./ScheduledView.module.css";

export function ScheduledView() {
  const { t } = useApp();
  const [open, setOpen] = useState(false);

  function onSubmit(_draft: TaskDraft) {
    setOpen(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.add} onClick={() => setOpen(true)}>
          {t("scheduled.addTask")}
        </button>
      </div>
      <p className={styles.empty}>{t("scheduled.empty")}</p>
      <Dialog
        open={open}
        title={t("dialog.task.createTitle")}
        onClose={() => setOpen(false)}
        size="large"
      >
        <TaskForm
          t={t}
          types={[]}
          submitLabel={t("board.addTask")}
          cancelLabel={t("action.cancel")}
          onCancel={() => setOpen(false)}
          onSubmit={onSubmit}
        />
      </Dialog>
    </div>
  );
}
