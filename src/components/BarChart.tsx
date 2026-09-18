import styles from "./BarChart.module.css";

export type BarDatum = {
  key: string;
  label: string;
  value: number;
};

type BarChartProps = {
  data: BarDatum[];
  empty: string;
  ariaLabel: string;
  layout?: "column" | "row";
};

function niceCeil(value: number): number {
  if (value <= 0) {
    return 1;
  }
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const ceilN = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return ceilN * pow;
}

function yTicks(max: number): number[] {
  const parts = max % 4 === 0 ? 4 : max % 2 === 0 ? 2 : 1;
  const step = max / parts;
  const ticks: number[] = [];
  for (let value = 0; value <= max; value += step) {
    ticks.push(value);
  }
  return ticks;
}

function shouldLabel(index: number, total: number): boolean {
  if (total <= 12) {
    return true;
  }
  if (index === 0 || index === total - 1) {
    return true;
  }
  if (total <= 21) {
    return index % 2 === 0;
  }
  if (total <= 45) {
    return index % 5 === 0;
  }
  const step = Math.ceil(total / 8);
  return index % step === 0;
}

function formatTick(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function BarChart({ data, empty, ariaLabel, layout = "column" }: BarChartProps) {
  const maxValue = Math.max(0, ...data.map((item) => item.value));
  if (data.length === 0 || maxValue <= 0) {
    return <p className={styles.empty}>{empty}</p>;
  }

  const max = niceCeil(maxValue);
  const ticks = yTicks(max);

  if (layout === "row") {
    return <RowChart data={data} max={max} ticks={ticks} ariaLabel={ariaLabel} />;
  }
  return <ColumnChart data={data} max={max} ticks={ticks} ariaLabel={ariaLabel} />;
}

function ColumnChart({
  data,
  max,
  ticks,
  ariaLabel,
}: {
  data: BarDatum[];
  max: number;
  ticks: number[];
  ariaLabel: string;
}) {
  const width = 720;
  const height = 240;
  const pad = { top: 16, right: 12, bottom: 36, left: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const slot = plotW / data.length;
  const barW = Math.max(2, slot * 0.62);

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
    >
      {ticks.map((tick) => {
        const y = pad.top + plotH - (tick / max) * plotH;
        return (
          <g key={tick}>
            <line
              className={styles.grid}
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
            />
            <text className={styles.tick} x={pad.left - 8} y={y + 3} textAnchor="end">
              {formatTick(tick)}
            </text>
          </g>
        );
      })}
      <line
        className={styles.axis}
        x1={pad.left}
        x2={pad.left}
        y1={pad.top}
        y2={pad.top + plotH}
      />
      <line
        className={styles.axis}
        x1={pad.left}
        x2={width - pad.right}
        y1={pad.top + plotH}
        y2={pad.top + plotH}
      />
      {data.map((item, index) => {
        const h = (item.value / max) * plotH;
        const x = pad.left + index * slot + (slot - barW) / 2;
        const y = pad.top + plotH - h;
        const cx = x + barW / 2;
        return (
          <g key={item.key}>
            <rect className={styles.bar} x={x} y={y} width={barW} height={Math.max(h, 0)}>
              <title>{`${item.label}: ${item.value}`}</title>
            </rect>
            {shouldLabel(index, data.length) ? (
              <text className={styles.label} x={cx} y={height - 12} textAnchor="middle">
                {item.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function RowChart({
  data,
  max,
  ticks,
  ariaLabel,
}: {
  data: BarDatum[];
  max: number;
  ticks: number[];
  ariaLabel: string;
}) {
  const width = 520;
  const height = 260;
  const pad = { top: 8, right: 16, bottom: 36, left: 118 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const rowH = plotH / Math.max(data.length, 1);
  const barH = Math.min(18, rowH * 0.5);

  return (
    <svg
      className={`${styles.svg} ${styles.row}`}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
    >
      {ticks.map((tick) => {
        const x = pad.left + (tick / max) * plotW;
        return (
          <g key={tick}>
            <line className={styles.grid} x1={x} x2={x} y1={pad.top} y2={pad.top + plotH} />
            <text className={styles.tick} x={x} y={height - 10} textAnchor="middle">
              {formatTick(tick)}
            </text>
          </g>
        );
      })}
      <line
        className={styles.axis}
        x1={pad.left}
        x2={width - pad.right}
        y1={pad.top + plotH}
        y2={pad.top + plotH}
      />
      <line
        className={styles.axis}
        x1={pad.left}
        x2={pad.left}
        y1={pad.top}
        y2={pad.top + plotH}
      />
      {data.map((item, index) => {
        const y = pad.top + index * rowH + (rowH - barH) / 2;
        const w = (item.value / max) * plotW;
        const labelY = y + barH / 2 + 4;
        return (
          <g key={item.key}>
            <text
              className={styles.cat}
              x={pad.left - 10}
              y={labelY}
              textAnchor="end"
            >
              {item.label.length > 14 ? `${item.label.slice(0, 13)}…` : item.label}
              <title>{item.label}</title>
            </text>
            <rect className={styles.bar} x={pad.left} y={y} width={Math.max(w, 0)} height={barH}>
              <title>{`${item.label}: ${item.value}`}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}
