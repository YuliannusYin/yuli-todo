import { useState } from "react";
import { Dialog } from "../components/Dialog";
import { TaskForm } from "../components/TaskForm";
import { useApp } from "../context/AppContext";
import type { BoardColumn, TaskDraft } from "../lib/types";
import styles from "./BoardView.module.css";

const COLUMNS: BoardColumn[] = ["todo", "doing", "done"];

export function BoardView() {
  const { t } = useApp();
  const [open, setOpen] = useState(false);

  function onSubmit(_draft: TaskDraft) {
    setOpen(false);
  }

  return (
    <div className={styles.page}>
      {COLUMNS.map((column) => (
        <section key={column} className={styles.column}>
          <header className={styles.header} data-column-header>
            <h2 className={styles.title}>{t(`board.column.${column}`)}</h2>
            <span className={styles.count}>0</span>
          </header>
          <div className={styles.body}>
            <p className={styles.empty}>{t(`board.empty.${column}`)}</p>
          </div>
          {column === "todo" ? (
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.add}
                onClick={() => setOpen(true)}
              >
                {t("board.addTask")}
              </button>
            </div>
          ) : null}
        </section>
      ))}
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
