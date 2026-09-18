import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { IconX } from "./icons";
import styles from "./Dialog.module.css";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type DialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "default" | "large";
  closeLabel?: string;
};

export function Dialog({
  open,
  title,
  onClose,
  children,
  footer,
  size = "default",
  closeLabel,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
    const autofocused = panel?.querySelector<HTMLElement>("[autofocus]");
    (autofocused ?? focusables?.[0])?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) {
        return;
      }
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null || node === document.activeElement,
      );
      if (nodes.length === 0) {
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  function onOverlay(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return createPortal(
    <div className={styles.overlay} onMouseDown={onOverlay}>
      <div
        ref={panelRef}
        className={styles.panel}
        data-size={size}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {closeLabel ? (
          <button
            type="button"
            className={styles.close}
            aria-label={closeLabel}
            title={closeLabel}
            onClick={onClose}
          >
            <IconX size={15} />
          </button>
        ) : null}
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
        </div>
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export function DialogButton({
  children,
  onClick,
  variant = "secondary",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "secondary" | "primary" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const className = [
    styles.button,
    variant === "primary" ? styles.primary : "",
    variant === "danger" ? styles.danger : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      className={className}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
