import { useState, type FormEvent, type KeyboardEvent } from "react";
import type { TaskDraft, TaskType } from "../lib/types";
import styles from "./TaskForm.module.css";
import { DialogButton } from "./Dialog";
import { IconCheck, IconTimer, IconX, IconAlert } from "./icons";

const EMPTY_DRAFT: TaskDraft = {
  name: "",
  type_id: null,
  content: "",
  notes: "",
  tags: [],
  start_at: null,
  end_at: null,
};

type TaskFormProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  types: TaskType[];
  typesEnabled?: boolean;
  initial?: TaskDraft;
  completedAt?: string | null;
  durationLabel?: string | null;
  submitLabel: string;
  cancelLabel: string;
  error?: string | null;
  onCancel: () => void;
  onSubmit: (draft: TaskDraft) => void | Promise<void>;
  onCreateType?: (name: string) => Promise<TaskType>;
};

function TagInput({
  tags,
  onChange,
  placeholder,
  removeLabel,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  removeLabel: (tag: string) => string;
}) {
  const [value, setValue] = useState("");

  function commit(raw: string) {
    const name = raw.trim().replace(/^,+|,+$/g, "");
    if (name && !tags.some((tag) => tag.toLowerCase() === name.toLowerCase())) {
      onChange([...tags, name]);
    }
    setValue("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit(value);
    } else if (event.key === "Backspace" && value === "" && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className={styles.tagBox}>
      {tags.map((tag) => (
        <span key={tag} className={styles.tagChip}>
          {tag}
          <button
            type="button"
            className={styles.tagRemove}
            aria-label={removeLabel(tag)}
            onClick={() => onChange(tags.filter((item) => item !== tag))}
          >
            <IconX size={11} />
          </button>
        </span>
      ))}
      <input
        className={styles.tagInput}
        value={value}
        placeholder={tags.length ? "" : placeholder}
        onChange={(event) => {
          const next = event.target.value;
          if (next.includes(",")) {
            for (const part of next.split(",")) {
              if (part.trim()) {
                commit(part);
              }
            }
            return;
          }
          setValue(next);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => value.trim() && commit(value)}
      />
    </div>
  );
}

function ClearableDateInput({
  value,
  onChange,
  clearLabel,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  clearLabel: string;
}) {
  return (
    <div className={styles.dateField}>
      <input
        className={styles.input}
        type="datetime-local"
        step={60}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
      />
      {value ? (
        <button
          type="button"
          className={styles.dateClear}
          aria-label={clearLabel}
          title={clearLabel}
          onClick={() => onChange(null)}
        >
          <IconX size={12} />
        </button>
      ) : null}
    </div>
  );
}

export function TaskForm({
  t,
  types,
  typesEnabled = false,
  initial,
  completedAt,
  durationLabel,
  submitLabel,
  cancelLabel,
  error,
  onCancel,
  onSubmit,
  onCreateType,
}: TaskFormProps) {
  const [draft, setDraft] = useState<TaskDraft>(initial ?? EMPTY_DRAFT);
  const [newTypeName, setNewTypeName] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ ...draft, name: draft.name.trim() });
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.field}>
        <span className={styles.label}>{t("field.name")}</span>
        <input
          className={styles.input}
          value={draft.name}
          onChange={(event) =>
            setDraft((current) => ({ ...current, name: event.target.value }))
          }
          required
          maxLength={200}
          autoFocus
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>{t("field.type")}</span>
        <div className={styles.typeRow}>
          <select
            className={styles.select}
            value={draft.type_id ?? ""}
            disabled={!typesEnabled}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                type_id: event.target.value || null,
              }))
            }
          >
            <option value="">{t("field.none")}</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {typesEnabled ? (
            <input
              className={styles.input}
              value={newTypeName}
              placeholder={t("settings.types.placeholder")}
              onChange={(event) => setNewTypeName(event.target.value)}
              maxLength={40}
            />
          ) : null}
          <DialogButton
            disabled={!typesEnabled}
            onClick={() => {
              const name = newTypeName.trim();
              if (!name || !onCreateType) {
                return;
              }
              void onCreateType(name).then((created) => {
                setDraft((current) => ({ ...current, type_id: created.id }));
                setNewTypeName("");
              });
            }}
          >
            {t("field.newType")}
          </DialogButton>
        </div>
      </label>
      <label className={styles.field}>
        <span className={styles.label}>{t("field.content")}</span>
        <textarea
          className={styles.textarea}
          value={draft.content}
          onChange={(event) =>
            setDraft((current) => ({ ...current, content: event.target.value }))
          }
          maxLength={20000}
        />
      </label>
      <div className={styles.field}>
        <span className={styles.label}>{t("field.tags")}</span>
        <TagInput
          tags={draft.tags}
          onChange={(tags) => setDraft((current) => ({ ...current, tags }))}
          placeholder={t("field.tagsPlaceholder")}
          removeLabel={(tag) => t("tag.remove", { tag })}
        />
      </div>
      <label className={styles.field}>
        <span className={styles.label}>{t("field.notes")}</span>
        <textarea
          className={styles.textarea}
          value={draft.notes}
          onChange={(event) =>
            setDraft((current) => ({ ...current, notes: event.target.value }))
          }
          maxLength={20000}
        />
      </label>
      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.label}>{t("field.startAt")}</span>
          <ClearableDateInput
            value={draft.start_at}
            onChange={(start_at) => setDraft((current) => ({ ...current, start_at }))}
            clearLabel={t("action.clear")}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>{t("field.endAt")}</span>
          <ClearableDateInput
            value={draft.end_at}
            onChange={(end_at) => setDraft((current) => ({ ...current, end_at }))}
            clearLabel={t("action.clear")}
          />
        </div>
      </div>
      {completedAt || durationLabel ? (
        <div className={styles.readonlyBox}>
          {completedAt ? (
            <div className={styles.readonlyRow}>
              <IconCheck size={13} />
              <span>{t("card.completed", { time: completedAt })}</span>
            </div>
          ) : null}
          {durationLabel ? (
            <div className={styles.readonlyRow}>
              <IconTimer size={13} />
              <span>{t("card.duration", { duration: durationLabel })}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          <IconAlert size={14} />
          <span>{error}</span>
        </p>
      ) : null}
      <div className={styles.actions}>
        <DialogButton onClick={onCancel}>{cancelLabel}</DialogButton>
        <DialogButton type="submit" variant="primary">
          {submitLabel}
        </DialogButton>
      </div>
    </form>
  );
}
