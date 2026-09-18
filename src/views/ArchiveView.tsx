import { useMemo, useState } from "react";
import { Dialog, DialogButton } from "../components/Dialog";
import { IconArchive, IconSearch, IconTrash, IconX } from "../components/icons";
import { StatusChip } from "../components/StatusChip";
import { useApp } from "../context/AppContext";
import { useTasks } from "../context/TaskContext";
import { endOfLocalDay, formatDateTime, formatDuration, startOfLocalDay } from "../lib/datetime";
import { isCommandError } from "../lib/errors";
import type { Task, TaskStatus } from "../lib/types";
import styles from "./ArchiveView.module.css";

const ARCHIVE_STATUSES: TaskStatus[] = ["done", "belated", "force_ended"];

type Filters = {
  search: string;
  status: string;
  typeId: string;
  tag: string;
  from: string;
  to: string;
};

const EMPTY_FILTERS: Filters = {
  search: "",
  status: "",
  typeId: "",
  tag: "",
  from: "",
  to: "",
};

function matches(task: Task, filters: Filters): boolean {
  const needle = filters.search.trim().toLowerCase();
  if (needle && !task.name.toLowerCase().includes(needle)) {
    return false;
  }
  if (filters.status && task.status !== filters.status) {
    return false;
  }
  if (filters.typeId && task.type_id !== filters.typeId) {
    return false;
  }
  if (filters.tag && !task.tags.some((tag) => tag.name === filters.tag)) {
    return false;
  }
  if (!task.archived_at) {
    return false;
  }
  const archivedMs = new Date(task.archived_at).getTime();
  if (Number.isNaN(archivedMs)) {
    return false;
  }
  if (filters.from) {
    const from = startOfLocalDay(filters.from);
    if (from !== null && archivedMs < from) {
      return false;
    }
  }
  if (filters.to) {
    const to = endOfLocalDay(filters.to);
    if (to !== null && archivedMs > to) {
      return false;
    }
  }
  return true;
}

function hasActiveFilters(filters: Filters): boolean {
  return Boolean(
    filters.search.trim() ||
      filters.status ||
      filters.typeId ||
      filters.tag ||
      filters.from ||
      filters.to,
  );
}

export function ArchiveView() {
  const { t, settings } = useApp();
  const { archive, types, removeTask } = useTasks();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tags = useMemo(() => {
    const names = new Set<string>();
    for (const task of archive) {
      for (const tag of task.tags) {
        names.add(tag.name);
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [archive]);

  const filtered = useMemo(
    () => archive.filter((task) => matches(task, filters)),
    [archive, filters],
  );
  const filtering = hasActiveFilters(filters);
  const pending = archive.find((task) => task.id === pendingId) ?? null;

  function patch(partial: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...partial }));
  }

  return (
    <div className={styles.page}>
      <form className={styles.filters} onSubmit={(event) => event.preventDefault()}>
        <label className={styles.field}>
          {t("archive.filter.search")}
          <span className={styles.searchBox}>
            <IconSearch size={14} />
            <input
              className={styles.searchInput}
              value={filters.search}
              onChange={(event) => patch({ search: event.target.value })}
            />
          </span>
        </label>
        <label className={styles.field}>
          {t("archive.filter.status")}
          <select
            className={styles.input}
            value={filters.status}
            onChange={(event) => patch({ status: event.target.value })}
          >
            <option value="">{t("archive.filter.allStatuses")}</option>
            {ARCHIVE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          {t("archive.filter.type")}
          <select
            className={styles.input}
            value={filters.typeId}
            onChange={(event) => patch({ typeId: event.target.value })}
          >
            <option value="">{t("archive.filter.allTypes")}</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          {t("archive.filter.tag")}
          <select
            className={styles.input}
            value={filters.tag}
            onChange={(event) => patch({ tag: event.target.value })}
          >
            <option value="">{t("archive.filter.allTags")}</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          {t("archive.filter.from")}
          <input
            className={styles.input}
            type="date"
            value={filters.from}
            onChange={(event) => patch({ from: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          {t("archive.filter.to")}
          <input
            className={styles.input}
            type="date"
            value={filters.to}
            onChange={(event) => patch({ to: event.target.value })}
          />
        </label>
        {filtering ? (
          <button
            type="button"
            className={styles.clear}
            onClick={() => setFilters(EMPTY_FILTERS)}
          >
            <IconX size={13} />
            {t("archive.clearFilters")}
          </button>
        ) : null}
      </form>

      {archive.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <IconArchive size={20} />
          </span>
          <p className={styles.emptyText}>{t("archive.empty")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <IconSearch size={20} />
          </span>
          <p className={styles.emptyText}>{t("archive.noMatches")}</p>
          <button
            type="button"
            className={styles.emptyClear}
            onClick={() => setFilters(EMPTY_FILTERS)}
          >
            {t("archive.clearFilters")}
          </button>
        </div>
      ) : (
        <>
          <div className={styles.resultBar}>
            {filtering
              ? t("archive.countFiltered", { shown: filtered.length, total: archive.length })
              : t("archive.count", { count: filtered.length })}
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t("archive.col.name")}</th>
                  <th>{t("archive.col.status")}</th>
                  <th>{t("archive.col.type")}</th>
                  <th>{t("archive.col.tags")}</th>
                  <th>{t("archive.col.completed")}</th>
                  <th>{t("archive.col.duration")}</th>
                  <th>{t("archive.col.archived")}</th>
                  <th>{t("archive.col.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => (
                  <tr key={task.id}>
                    <td className={styles.nameCell}>{task.name}</td>
                    <td>
                      <StatusChip status={task.status} label={t(`status.${task.status}`)} />
                    </td>
                    <td>{task.type_name ?? t("field.none")}</td>
                    <td>
                      {task.tags.length
                        ? task.tags.map((tag) => tag.name).join(", ")
                        : t("field.none")}
                    </td>
                    <td className={styles.monoCell}>
                      {task.completed_at
                        ? formatDateTime(task.completed_at, settings.locale)
                        : t("field.none")}
                    </td>
                    <td className={styles.monoCell}>
                      {formatDuration(task.doing_elapsed_seconds, settings.locale)}
                    </td>
                    <td className={styles.monoCell}>
                      {task.archived_at
                        ? formatDateTime(task.archived_at, settings.locale)
                        : t("field.none")}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.delete}
                        aria-label={t("action.delete")}
                        title={t("action.delete")}
                        onClick={() => {
                          setError(null);
                          setPendingId(task.id);
                        }}
                      >
                        <IconTrash size={14} />
                        <span>{t("action.delete")}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog
        open={Boolean(pending)}
        title={t("dialog.delete.title")}
        onClose={() => setPendingId(null)}
        closeLabel={t("action.close")}
      >
        <p>{t("dialog.delete.body")}</p>
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.dialogActions}>
          <DialogButton onClick={() => setPendingId(null)}>{t("action.cancel")}</DialogButton>
          <DialogButton
            variant="danger"
            onClick={() => {
              if (!pending) {
                return;
              }
              void removeTask(pending.id)
                .then(() => {
                  setPendingId(null);
                  setError(null);
                })
                .catch((caught: unknown) =>
                  setError(
                    isCommandError(caught) ? t(caught.messageKey) : t("error.storage.body"),
                  ),
                );
            }}
          >
            {t("dialog.delete.confirm")}
          </DialogButton>
        </div>
      </Dialog>
    </div>
  );
}
