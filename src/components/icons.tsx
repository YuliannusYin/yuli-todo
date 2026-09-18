import type { SVGProps } from "react";

/* Inline line icons — inherit color via currentColor, no network dependency. */

export type IconProps = Omit<SVGProps<SVGSVGElement>, "strokeWidth"> & {
  size?: number;
  strokeWidth?: number;
};

function base({ size = 16, strokeWidth = 1.8, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...props,
  };
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.2l2.3 2.3 4.7-5" />
    </svg>
  );
}

export function IconTimer(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 13v-3.5" />
      <path d="M12 13l2.6 2.6" />
      <circle cx="12" cy="13" r="8" />
      <path d="M9 2h6" />
    </svg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  );
}

export function IconX(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5L21.5 20H2.5L12 3.5z" />
      <path d="M12 10v4.5" />
      <path d="M12 17.2v.1" />
    </svg>
  );
}

export function IconArchive(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="4.5" width="17" height="4.5" rx="1.5" />
      <path d="M5.5 9v10.5h13V9M10 13h4" />
    </svg>
  );
}

export function IconClipboard(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="4.5" width="14" height="16.5" rx="2.5" />
      <path d="M9 4.5a3 3 0 0 1 6 0M9 11h6M9 15h4" />
    </svg>
  );
}

export function IconPlay(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M10 8.5l5 3.5-5 3.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconFlag(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 21V4" />
      <path d="M5 4.5h11.5l-2.2 3.5L16.5 12H5" />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 6.5h15M9 6.5V4.8h6v1.7M6.5 6.5l1 13h9l1-13" />
      <path d="M10 10.5v6M14 10.5v6" />
    </svg>
  );
}

export function IconInbox(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 13.5V5.5h16v8" />
      <path d="M4 13.5l3 0 1.5 3h7l1.5-3 3 0V18.5h-16z" />
    </svg>
  );
}

export function IconChart(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 19.5h16" />
      <path d="M7 16.5v-5" />
      <path d="M12 16.5V7" />
      <path d="M17 16.5v-8" />
    </svg>
  );
}
