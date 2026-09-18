import { useMemo, useState } from "react";
import { BarChart } from "../components/BarChart";
import { IconChart } from "../components/icons";
import { useApp } from "../context/AppContext";
import { useTasks } from "../context/TaskContext";
import { formatDuration, parseLocalDateKey } from "../lib/datetime";
import {
  NONE_ID,
  OTHER_ID,
  boardWip,
  buildReport,
  resolvePeriod,
  shareOf,
  typeComparison,
  type BucketGranularity,
  type PeriodKind,
} from "../lib/report";
import type { LocaleId } from "../lib/types";
import styles from "./ReportsView.module.css";

const PERIODS: PeriodKind[] = ["week", "month", "year", "custom"];

function formatTrendLabel(
  key: string,
  kind: PeriodKind,
  granularity: BucketGranularity,
  locale: LocaleId,
): string {
  const localeTag = locale === "zh-CN" ? "zh-CN" : "en";
  if (granularity === "month") {
    const [year, month] = key.split("-").map(Number);
    const date = new Date(year, (month ?? 1) - 1, 1);
    if (kind === "year") {
      return new Intl.DateTimeFormat(localeTag, { month: "short" }).format(date);
    }
    return new Intl.DateTimeFormat(localeTag, { month: "short", year: "numeric" }).format(date);
  }
  const date = parseLocalDateKey(key);
  if (!date) {
    return key;
  }
  if (granularity === "week") {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
  if (kind === "week") {
    return new Intl.DateTimeFormat(localeTag, { weekday: "short" }).format(date);
  }
  return String(date.getDate());
}

export function ReportsView() {
  const { t, settings } = useApp();
  const { board, scheduled, archive } = useTasks();
  const [kind, setKind] = useState<PeriodKind>("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const range = useMemo(
    () => resolvePeriod(kind, new Date(), customFrom, customTo),
    [kind, customFrom, customTo],
  );

  const tasks = useMemo(() => [...board, ...scheduled, ...archive], [archive, board, scheduled]);
  const report = useMemo(() => buildReport(tasks, range), [range, tasks]);
  const wip = useMemo(() => boardWip(board), [board]);
  const compared = useMemo(() => typeComparison(report.types), [report.types]);

  function labelRow(id: string, name: string, noneKey: string) {
    if (id === NONE_ID) {
      return t(noneKey);
    }
    if (id === OTHER_ID) {
      return t("reports.other");
    }
    return name || t(noneKey);
  }

  function selectPeriod(next: PeriodKind) {
    if (next === "custom") {
      const week = resolvePeriod("week");
      setCustomFrom((current) => current || week.fromKey);
      setCustomTo((current) => current || week.toKey);
    }
    setKind(next);
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.toolbar}>
          <h1 className={styles.heading}>{t("nav.reports")}</h1>
          <div className={styles.periods} aria-label={t("reports.period.label")}>
            {PERIODS.map((item) => (
              <button
                key={item}
                type="button"
                className={styles.periodBtn}
                data-active={kind === item ? true : undefined}
                aria-pressed={kind === item}
                onClick={() => selectPeriod(item)}
              >
                {t(`reports.period.${item}`)}
              </button>
            ))}
          </div>
          {kind === "custom" ? (
            <div className={styles.dates}>
              <label className={styles.dateField}>
                {t("reports.period.from")}
                <input
                  className={styles.input}
                  type="date"
                  value={customFrom}
                  onChange={(event) => setCustomFrom(event.target.value)}
                />
              </label>
              <label className={styles.dateField}>
                {t("reports.period.to")}
                <input
                  className={styles.input}
                  type="date"
                  value={customTo}
                  onChange={(event) => setCustomTo(event.target.value)}
                />
              </label>
            </div>
          ) : null}
        </header>

        <section className={styles.section} aria-labelledby="reports-wip">
          <h2 id="reports-wip" className={styles.sectionTitle}>
            {t("reports.wip.title")}
          </h2>
          <div className={styles.wipGrid}>
            <Metric label={t("reports.wip.todo")} value={String(wip.todo)} />
            <Metric label={t("reports.wip.doing")} value={String(wip.doing)} />
            <Metric label={t("reports.wip.overdue")} value={String(wip.overdue)} />
          </div>
        </section>

        <section className={styles.metrics} aria-label={t("reports.metrics")}>
          <Metric label={t("reports.metric.completed")} value={String(report.completedCount)} />
          <Metric
            label={t("reports.metric.duration")}
            value={formatDuration(report.durationSeconds, settings.locale)}
          />
          <Metric label={t("reports.metric.done")} value={String(report.doneCount)} />
          <Metric label={t("reports.metric.belated")} value={String(report.belatedCount)} />
          <Metric label={t("reports.metric.forceEnded")} value={String(report.forceEndedCount)} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t("reports.trend.title")}</h2>
          {report.completedCount === 0 ? (
            <Empty copy={t("reports.trend.empty")} />
          ) : (
            <BarChart
              ariaLabel={t("reports.chart.trend")}
              empty={t("reports.trend.empty")}
              data={report.trend.map((point) => ({
                key: point.key,
                value: point.count,
                label: formatTrendLabel(point.key, kind, range.granularity, settings.locale),
              }))}
            />
          )}
        </section>

        <div className={styles.split}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t("reports.types.title")}</h2>
            {report.types.length === 0 ? (
              <Empty copy={t("reports.types.empty")} />
            ) : (
              <BarChart
                layout="row"
                ariaLabel={t("reports.chart.types")}
                empty={t("reports.types.empty")}
                data={compared.map((row) => ({
                  key: row.id,
                  value: row.count,
                  label: labelRow(row.id, row.name, "reports.noneType"),
                }))}
              />
            )}
          </section>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t("reports.types.title")}</h2>
            {report.types.length === 0 ? (
              <Empty copy={t("reports.types.empty")} />
            ) : (
              <BreakdownTable
                rows={report.types.map((row) => ({
                  id: row.id,
                  name: labelRow(row.id, row.name, "reports.noneType"),
                  count: row.count,
                  duration: formatDuration(row.durationSeconds, settings.locale),
                  share: shareOf(row.count, report.completedCount),
                }))}
                showShare
                countLabel={t("reports.col.count")}
                durationLabel={t("reports.col.duration")}
                nameLabel={t("reports.col.name")}
                shareLabel={t("reports.col.share")}
              />
            )}
          </section>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t("reports.tags.title")}</h2>
          {report.tags.length === 0 ? (
            <Empty copy={t("reports.tags.empty")} />
          ) : (
            <>
              <BreakdownTable
                rows={report.tags.map((row) => ({
                  id: row.id,
                  name: labelRow(row.id, row.name, "reports.untagged"),
                  count: row.count,
                  duration: formatDuration(row.durationSeconds, settings.locale),
                  share: "",
                }))}
                countLabel={t("reports.col.count")}
                durationLabel={t("reports.col.duration")}
                nameLabel={t("reports.col.name")}
                shareLabel={t("reports.col.share")}
              />
              <p className={styles.footnote}>{t("reports.tags.overlap")}</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{value}</span>
    </div>
  );
}

function Empty({ copy }: { copy: string }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>
        <IconChart size={22} />
      </span>
      <p className={styles.emptyText}>{copy}</p>
    </div>
  );
}

function BreakdownTable({
  rows,
  showShare = false,
  nameLabel,
  countLabel,
  durationLabel,
  shareLabel,
}: {
  rows: { id: string; name: string; count: number; duration: string; share: string }[];
  showShare?: boolean;
  nameLabel: string;
  countLabel: string;
  durationLabel: string;
  shareLabel: string;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{nameLabel}</th>
            <th>{countLabel}</th>
            <th>{durationLabel}</th>
            {showShare ? <th>{shareLabel}</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className={styles.nameCell}>{row.name}</td>
              <td className={styles.monoCell}>{row.count}</td>
              <td className={styles.monoCell}>{row.duration}</td>
              {showShare ? <td className={styles.monoCell}>{row.share}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
