import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDndContext,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useState, type ReactNode } from "react";
import { ContextMenu, ContextMenuItem } from "../components/ContextMenu";
import { Dialog, DialogButton } from "../components/Dialog";
import { IconCheck, IconInbox, IconPlay, IconPlus } from "../components/icons";
import { TaskCard } from "../components/TaskCard";
import { TaskForm } from "../components/TaskForm";
import { useApp } from "../context/AppContext";
import { useTasks } from "../context/TaskContext";
import { useBoardMove } from "../lib/boardMove";
import { formatDateTime, formatDuration, toLocalInput, toUtcIso } from "../lib/datetime";
import { isCommandError } from "../lib/errors";
import type { BoardColumn, LocaleId, Task, TaskDraft } from "../lib/types";
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

function DropColumn({
  column,
  children,
}: {
  column: BoardColumn;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column });
  return (
    <section
      ref={setNodeRef}
      className={styles.column}
      data-column
      data-over={isOver ? true : undefined}
    >
      {children}
    </section>
  );
}

function DragCard({
  task,
  children,
}: {
  task: Task;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { column: task.board_column },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      data-dragging={isDragging ? true : undefined}
    >
      {children}
    </div>
  );
}

function BoardDragOverlay({
  tasks,
  locale,
  t,
}: {
  tasks: Task[];
  locale: LocaleId;
  t: (key: string) => string;
}) {
  const { active } = useDndContext();
  if (!active) {
    return null;
  }
  const task = tasks.find((item) => item.id === String(active.id));
  if (!task) {
    return null;
  }
  const width = active.rect.current.initial?.width;
  return (
    <DragOverlay dropAnimation={null}>
      <div data-drag-overlay style={width ? { width } : undefined}>
        <TaskCard task={task} locale={locale} t={t} onOpen={() => undefined} />
      </div>
    </DragOverlay>
  );
}

export function BoardView() {
  const { t, settings } = useApp();
  const { board, types, saveNew, saveExisting, addType, setToast, moveToColumn, archiveTask } =
    useTasks();
  const { pendingDone, onDrop, confirmDone, cancelDone } = useBoardMove(moveToColumn);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; task: Task } | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Task | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

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

  async function handleDragEnd(event: DragEndEvent) {
    const overId = event.over?.id;
    const from = event.active.data.current?.column as BoardColumn | undefined;
    if (!overId || !from) {
      return;
    }
    const to = String(overId) as BoardColumn;
    if (!COLUMNS.includes(to)) {
      return;
    }
    await onDrop(String(event.active.id), from, to);
  }

  const archiveIncomplete = archiveTarget
    ? !["done", "belated"].includes(archiveTarget.status)
    : false;

  return (
    <DndContext sensors={sensors} onDragEnd={(event) => void handleDragEnd(event)}>
      <div className={styles.page}>
        {COLUMNS.map((column) => {
          const cards = board.filter((task) => task.board_column === column);
          return (
            <DropColumn key={column} column={column}>
              <header className={styles.header} data-column-header>
                <div className={styles.headerRow}>
                  <h2 className={styles.title}>{t(`board.column.${column}`)}</h2>
                  <span className={styles.count} data-count>
                    {cards.length}
                  </span>
                </div>
              </header>
              <div className={styles.body} data-column-body={column}>
                {cards.length === 0 ? (
                  <div className={styles.empty}>
                    <span className={styles.emptyIcon}>
                      {column === "todo" ? (
                        <IconInbox size={20} />
                      ) : column === "doing" ? (
                        <IconPlay size={20} />
                      ) : (
                        <IconCheck size={20} />
                      )}
                    </span>
                    <span className={styles.emptyText}>{t(`board.empty.${column}`)}</span>
                    {column === "todo" ? (
                      <button
                        type="button"
                        className={styles.emptyAdd}
                        onClick={openCreate}
                      >
                        <IconPlus size={14} />
                        {t("board.addTask")}
                      </button>
                    ) : null}
                  </div>
                ) : (
                  cards.map((task) => (
                    <div
                      key={task.id}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        setMenu({ x: event.clientX, y: event.clientY, task });
                      }}
                    >
                      <DragCard task={task}>
                        <TaskCard
                          task={task}
                          locale={settings.locale}
                          t={t}
                          onOpen={(next) => {
                            setEditing(next);
                            setOpen(true);
                          }}
                        />
                      </DragCard>
                    </div>
                  ))
                )}
              </div>
              {column === "todo" ? (
                <div className={styles.footer}>
                  <button type="button" className={styles.add} onClick={openCreate}>
                    <IconPlus size={15} />
                    {t("board.addTask")}
                  </button>
                </div>
              ) : null}
            </DropColumn>
          );
        })}
      </div>
      <BoardDragOverlay tasks={board} locale={settings.locale} t={t} />
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
      <Dialog
        open={Boolean(pendingDone)}
        title={t("dialog.done.title")}
        onClose={cancelDone}
        closeLabel={t("action.close")}
      >
        <p>{t("dialog.done.body")}</p>
        <div className={styles.dialogActions}>
          <DialogButton onClick={cancelDone}>{t("action.cancel")}</DialogButton>
          <DialogButton variant="primary" onClick={() => void confirmDone()}>
            {t("dialog.done.confirm")}
          </DialogButton>
        </div>
      </Dialog>
      <Dialog
        open={Boolean(archiveTarget)}
        title={t("dialog.archiveNow.title")}
        onClose={() => setArchiveTarget(null)}
        closeLabel={t("action.close")}
      >
        <p>
          {archiveIncomplete
            ? t("dialog.archiveNow.bodyIncomplete")
            : t("dialog.archiveNow.bodyDone")}
        </p>
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
    </DndContext>
  );
}
