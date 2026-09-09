"use client";

import { fr, type FrIconClassName, type RiIconClassName } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

import styles from "./DropdownMenu.module.css";

type DropdownMenuProps = {
  label: ReactNode;
  buttonIconId: FrIconClassName | RiIconClassName;
  ariaLabel?: string;
  children: (api: { close: () => void; open: boolean }) => ReactNode;
};

export function DropdownMenu({ label, buttonIconId, ariaLabel, children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const focusTrigger = useCallback(() => {
    containerRef.current?.querySelector<HTMLButtonElement>("[data-dropdown-trigger] button")?.focus();
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      focusTrigger();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, focusTrigger]);

  const items = () => Array.from(containerRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();
    const menuItems = items();
    if (menuItems.length === 0) return;

    const current = menuItems.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === "ArrowDown" ? (current + 1) % menuItems.length : (current <= 0 ? menuItems.length : current) - 1;
    menuItems[next]?.focus();
  };

  return (
    <div className={styles.container} ref={containerRef} onKeyDown={handleKeyDown}>
      <span data-dropdown-trigger>
        <Button
          iconId={buttonIconId}
          priority="tertiary no outline"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={ariaLabel}
          onClick={() => setOpen((previous) => !previous)}
        >
          {label}
          <i
            className={fr.cx(open ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line", "fr-icon--sm")}
            aria-hidden="true"
          />
        </Button>
      </span>

      {open && (
        <ul className={styles.panel} role="menu" onClick={close}>
          {children({ close, open })}
        </ul>
      )}
    </div>
  );
}

type DropdownMenuLinkProps = {
  href: string;
  icon?: FrIconClassName | RiIconClassName;
  target?: string;
  separator?: boolean;
  children: ReactNode;
};

export function DropdownMenuLink({ href, icon, target, separator, children }: DropdownMenuLinkProps) {
  return (
    <li className={separator ? styles.separator : undefined}>
      <a role="menuitem" href={href} target={target} className={styles.item}>
        {icon && <i className={`${fr.cx(icon, "fr-icon--sm")} ${styles.icon}`} aria-hidden="true" />}
        {children}
      </a>
    </li>
  );
}

type DropdownMenuButtonProps = {
  onClick: () => void;
  icon?: FrIconClassName | RiIconClassName;
  separator?: boolean;
  danger?: boolean;
  children: ReactNode;
};

export function DropdownMenuButton({ onClick, icon, separator, danger, children }: DropdownMenuButtonProps) {
  return (
    <li className={separator ? styles.separator : undefined}>
      <button
        type="button"
        role="menuitem"
        className={`${styles.item} ${danger ? styles.danger : ""}`}
        onClick={onClick}
      >
        {icon && <i className={`${fr.cx(icon, "fr-icon--sm")} ${styles.icon}`} aria-hidden="true" />}
        {children}
      </button>
    </li>
  );
}

export function DropdownMenuSubheader({ children }: { children: ReactNode }) {
  return (
    <li className={styles.subheader} role="presentation">
      {children}
    </li>
  );
}
