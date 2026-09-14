import { useState, type FormEvent } from "react";
import type { TaskDraft, TaskType } from "../lib/types";
import styles from "./TaskForm.module.css";
import { DialogButton } from "./Dialog";

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
  const [tagText, setTagText] = useState((initial?.tags ?? []).join(", "));
  const [newTypeName, setNewTypeName] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const tags = tagText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    onSubmit({ ...draft, tags, name: draft.name.trim() });
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
      <label className={styles.field}>
        <span className={styles.label}>{t("field.tags")}</span>
        <input
          className={styles.input}
          value={tagText}
          onChange={(event) => setTagText(event.target.value)}
        />
      </label>
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
        <label className={styles.field}>
          <span className={styles.label}>{t("field.startAt")}</span>
          <input
            className={styles.input}
            type="datetime-local"
            step={60}
            value={draft.start_at ?? ""}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                start_at: event.target.value || null,
              }))
            }
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{t("field.endAt")}</span>
          <input
            className={styles.input}
            type="datetime-local"
            step={60}
            value={draft.end_at ?? ""}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                end_at: event.target.value || null,
              }))
            }
          />
        </label>
      </div>
      {completedAt ? (
        <p className={styles.readonly}>
          {t("card.completed", { time: completedAt })}
        </p>
      ) : null}
      {durationLabel ? (
        <p className={styles.readonly}>
          {t("card.duration", { duration: durationLabel })}
        </p>
      ) : null}
      {error ? <p className={styles.readonly}>{error}</p> : null}
      <div className={styles.row}>
        <DialogButton onClick={onCancel}>{cancelLabel}</DialogButton>
        <DialogButton type="submit" variant="primary">
          {submitLabel}
        </DialogButton>
      </div>
    </form>
  );
}
