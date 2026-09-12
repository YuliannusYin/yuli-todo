import { useState } from "react";
import { Dialog } from "../components/Dialog";
import { TaskCard } from "../components/TaskCard";
import { TaskForm } from "../components/TaskForm";
import { useApp } from "../context/AppContext";
import { useTasks } from "../context/TaskContext";
import { formatDateTime, formatDuration, toLocalInput, toUtcIso } from "../lib/datetime";
import { isCommandError } from "../lib/errors";
import type { BoardColumn, Task, TaskDraft } from "../lib/types";
import styles from "./BoardView.module.css";

const COLUMNS: BoardColumn[] = ["todo", "doing", "done"];

function toWrite(draft: TaskDraft) {
  return {
    ...draft,
    start_at: toUtcIso(draft.start_at),
    end_at: toUtcIso(draft.end_at),
  };
}

function toDraft(task: Task): TaskDraft {
  return {
    name: task.name,
    type_id: task.type_id,
    content: task.content,
    notes: task.notes,
    tags: task.tags.map((tag) => tag.name),
    start_at: toLocalInput(task.start_at),
    end_at: toLocalInput(task.end_at),
  };
}

export function BoardView() {
  const { t, settings } = useApp();
  const { board, types, saveNew, saveExisting, addType, setToast } = useTasks();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setEditing(null);
    setError(null);
  }

  async function onSubmit(draft: TaskDraft) {
    try {
      const payload = toWrite(draft);
      const saved = editing
        ? await saveExisting(editing.id, payload)
        : await saveNew(payload);
      if (saved.status === "will_do") {
        setToast(t("toast.savedToScheduled"));
      }
      close();
    } catch (caught) {
      setError(
        isCommandError(caught) ? t(caught.messageKey) : t("error.storage.body"),
      );
    }
  }

  return (
    <div className={styles.page}>
      {COLUMNS.map((column) => {
        const cards = board.filter((task) => task.board_column === column);
        return (
          <section key={column} className={styles.column}>
            <header className={styles.header} data-column-header>
              <h2 className={styles.title}>{t(`board.column.${column}`)}</h2>
              <span className={styles.count}>{cards.length}</span>
            </header>
            <div className={styles.body}>
              {cards.length === 0 ? (
                <p className={styles.empty}>{t(`board.empty.${column}`)}</p>
              ) : (
                cards.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    locale={settings.locale}
                    t={t}
                    onOpen={(next) => {
                      setEditing(next);
                      setOpen(true);
                    }}
                  />
                ))
              )}
            </div>
            {column === "todo" ? (
              <div className={styles.footer}>
                <button
                  type="button"
                  className={styles.add}
                  onClick={() => {
                    setEditing(null);
                    setOpen(true);
                  }}
                >
                  {t("board.addTask")}
                </button>
              </div>
            ) : null}
          </section>
        );
      })}
      <Dialog
        open={open}
        title={editing ? editing.name : t("dialog.task.createTitle")}
        onClose={close}
        size="large"
      >
        <TaskForm
          key={editing?.id ?? "new"}
          t={t}
          types={types}
          typesEnabled
          initial={editing ? toDraft(editing) : undefined}
          completedAt={
            editing?.completed_at
              ? formatDateTime(editing.completed_at, settings.locale)
              : null
          }
          durationLabel={
            editing?.completed_at
              ? formatDuration(editing.doing_elapsed_seconds, settings.locale)
              : null
          }
          submitLabel={editing ? t("action.save") : t("board.addTask")}
          cancelLabel={t("action.cancel")}
          error={error}
          onCancel={close}
          onSubmit={onSubmit}
          onCreateType={addType}
        />
      </Dialog>
    </div>
  );
}
