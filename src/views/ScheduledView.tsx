import { useState } from "react";
import { Dialog } from "../components/Dialog";
import { TaskCard } from "../components/TaskCard";
import { TaskForm } from "../components/TaskForm";
import { useApp } from "../context/AppContext";
import { useTasks } from "../context/TaskContext";
import { toLocalInput, toUtcIso } from "../lib/datetime";
import { isCommandError } from "../lib/errors";
import type { Task, TaskDraft } from "../lib/types";
import styles from "./ScheduledView.module.css";

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

export function ScheduledView() {
  const { t, settings } = useApp();
  const { scheduled, types, saveNew, saveExisting, addType, setToast } = useTasks();
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
      const saved = editing
        ? await saveExisting(editing.id, toWrite(draft))
        : await saveNew(toWrite(draft));
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
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.add}
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          {t("scheduled.addTask")}
        </button>
      </div>
      {scheduled.length === 0 ? (
        <p className={styles.empty}>{t("scheduled.empty")}</p>
      ) : (
        scheduled.map((task) => (
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
