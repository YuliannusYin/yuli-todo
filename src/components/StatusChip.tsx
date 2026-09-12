import type { TaskStatus } from "../lib/types";
import styles from "./StatusChip.module.css";

export function StatusChip({
  status,
  label,
}: {
  status: TaskStatus;
  label: string;
}) {
  const token = status.replaceAll("_", "-");
  return (
    <span
      className={styles.chip}
      style={{
        background: `var(--yl-status-${token})`,
        color: `var(--yl-status-${token}-text)`,
      }}
    >
      {label}
    </span>
  );
}
