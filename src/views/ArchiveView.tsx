import { useApp } from "../context/AppContext";
import styles from "./ArchiveView.module.css";

export function ArchiveView() {
  const { t } = useApp();
  return (
    <div className={styles.page}>
      <p className={styles.empty}>{t("archive.empty")}</p>
    </div>
  );
}
