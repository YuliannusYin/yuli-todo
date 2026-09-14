import { useState } from "react";
import { Dialog, DialogButton } from "../components/Dialog";
import { ContextMenu, ContextMenuItem } from "../components/ContextMenu";
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
  const { scheduled, types, saveNew, saveExisting, addType, setToast, archiveTask } = useTasks();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; task: Task } | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Task | null>(null);

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
          <div
            key={task.id}
            onContextMenu={(event) => {
              event.preventDefault();
              setMenu({ x: event.clientX, y: event.clientY, task });
            }}
          >
            <TaskCard
              task={task}
              locale={settings.locale}
              t={t}
              onOpen={(next) => {
                setEditing(next);
                setOpen(true);
              }}
            />
          </div>
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
      <Dialog
        open={Boolean(archiveTarget)}
        title={t("dialog.archiveNow.title")}
        onClose={() => setArchiveTarget(null)}
      >
        <p>{t("dialog.archiveNow.bodyIncomplete")}</p>
        <div className={styles.dialogActions}>
          <DialogButton onClick={() => setArchiveTarget(null)}>
            {t("action.cancel")}
          </DialogButton>
          <DialogButton
            variant="primary"
            onClick={() => {
              if (archiveTarget) {
                void archiveTask(archiveTarget.id);
              }
              setArchiveTarget(null);
            }}
          >
            {t("dialog.archiveNow.confirm")}
          </DialogButton>
        </div>
      </Dialog>
      {menu ? (
        <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
          <ContextMenuItem
            onClick={() => {
              setEditing(menu.task);
              setOpen(true);
              setMenu(null);
            }}
          >
            {t("action.openDetails")}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              setArchiveTarget(menu.task);
              setMenu(null);
            }}
          >
            {t("action.archiveNow")}
          </ContextMenuItem>
        </ContextMenu>
      ) : null}
    </div>
  );
}
