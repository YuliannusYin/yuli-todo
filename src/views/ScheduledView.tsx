import { useMemo, useState } from "react";
import { Dialog, DialogButton } from "../components/Dialog";
import { ContextMenu, ContextMenuItem } from "../components/ContextMenu";
import { IconCalendar, IconPlus } from "../components/icons";
import { TaskCard } from "../components/TaskCard";
import { TaskForm } from "../components/TaskForm";
import { useApp } from "../context/AppContext";
import { useTasks } from "../context/TaskContext";
import {
  dayDiffFromToday,
  formatDayHeader,
  localDayKey,
  toLocalInput,
  toUtcIso,
} from "../lib/datetime";
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

type DayGroup = {
  key: string;
  diff: number;
  dateLabel: string;
  tasks: Task[];
};

export function ScheduledView() {
  const { t, settings } = useApp();
  const { scheduled, types, saveNew, saveExisting, addType, setToast, archiveTask } = useTasks();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; task: Task } | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Task | null>(null);

  const groups = useMemo<DayGroup[]>(() => {
    const map = new Map<string, DayGroup>();
    for (const task of scheduled) {
      if (!task.start_at) {
        continue;
      }
      const date = new Date(task.start_at);
      const key = localDayKey(date);
      let group = map.get(key);
      if (!group) {
        group = {
          key,
          diff: dayDiffFromToday(task.start_at),
          dateLabel: formatDayHeader(task.start_at, settings.locale),
          tasks: [],
        };
        map.set(key, group);
      }
      group.tasks.push(task);
    }
    return [...map.values()].sort((a, b) => a.diff - b.diff);
  }, [scheduled, settings.locale]);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

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

  function relLabel(diff: number): string | null {
    if (diff === 0) {
      return t("scheduled.group.today");
    }
    if (diff === 1) {
      return t("scheduled.group.tomorrow");
    }
    return null;
  }

  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <div>
          <h1 className={styles.title}>{t("nav.scheduled")}</h1>
          <p className={styles.subtitle}>
            {t("scheduled.count", { count: scheduled.length })}
          </p>
        </div>
        <button type="button" className={styles.add} onClick={openCreate}>
          <IconPlus size={15} />
          {t("scheduled.addTask")}
        </button>
      </header>

      {scheduled.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <IconCalendar size={20} />
          </span>
          <p className={styles.emptyText}>{t("scheduled.empty")}</p>
          <button type="button" className={styles.emptyAdd} onClick={openCreate}>
            <IconPlus size={14} />
            {t("scheduled.addTask")}
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {groups.map((group) => (
            <section key={group.key} className={styles.group}>
              <div className={styles.groupHeader}>
                <h2 className={styles.groupTitle}>{group.dateLabel}</h2>
                {relLabel(group.diff) ? (
                  <span className={styles.groupBadge} data-rel={group.diff === 0 ? "today" : "soon"}>
                    {relLabel(group.diff)}
                  </span>
                ) : null}
                <span className={styles.groupCount}>{group.tasks.length}</span>
              </div>
              {group.tasks.map((task) => (
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
              ))}
            </section>
          ))}
        </div>
      )}
      <Dialog
        open={open}
        title={editing ? editing.name : t("dialog.task.createTitle")}
        onClose={close}
        size="large"
        closeLabel={t("action.close")}
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
        closeLabel={t("action.close")}
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
