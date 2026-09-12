import { formatDateTime, formatDuration } from "../lib/datetime";
import type { LocaleId, Task } from "../lib/types";
import { StatusChip } from "./StatusChip";
import styles from "./TaskCard.module.css";

type TaskCardProps = {
  task: Task;
  locale: LocaleId;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onOpen: (task: Task) => void;
};

export function TaskCard({ task, locale, t, onOpen }: TaskCardProps) {
  const extraTags = Math.max(0, task.tags.length - 2);
  const visibleTags = task.tags.slice(0, 2);
  const start = task.start_at ? formatDateTime(task.start_at, locale) : null;
  const end = task.end_at ? formatDateTime(task.end_at, locale) : null;
  let timeLine: string | null = null;
  if (start && end) {
    timeLine = `${start} → ${end}`;
  } else if (start) {
    timeLine = t("card.starts", { time: start });
  } else if (end) {
    timeLine = t("card.due", { time: end });
  }
  const showDoneMeta = task.board_column === "done";

  return (
    <button
      type="button"
      className={styles.card}
      data-card
      onClick={() => onOpen(task)}
    >
      <div className={styles.name}>{task.name}</div>
      <div className={styles.meta}>
        <StatusChip status={task.status} label={t(`status.${task.status}`)} />
        {task.type_name ? <span className={styles.type}>{task.type_name}</span> : null}
        {visibleTags.map((tag) => (
          <span key={tag.id} className={styles.tag}>
            {tag.name}
          </span>
        ))}
        {extraTags ? <span className={styles.more}>+{extraTags}</span> : null}
      </div>
      {timeLine ? <div className={styles.time}>{timeLine}</div> : null}
      {showDoneMeta && task.completed_at ? (
        <div className={styles.extra}>
          {t("card.completed", { time: formatDateTime(task.completed_at, locale) })}
        </div>
      ) : null}
      {showDoneMeta ? (
        <div className={styles.extra}>
          {t("card.duration", {
            duration: formatDuration(task.doing_elapsed_seconds, locale),
          })}
        </div>
      ) : null}
    </button>
  );
}
