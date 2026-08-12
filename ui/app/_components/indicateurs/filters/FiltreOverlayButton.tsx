"use client";

import { ReactNode, useEffect, useRef } from "react";

import filterStyles from "@/app/_components/filters/filters.module.scss";

import styles from "../indicateurs.module.scss";

interface FiltreOverlayButtonProps {
  buttonLabel: string;
  badge?: number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  panelWidth?: string;
  children: ReactNode;
}

export function FiltreOverlayButton({
  buttonLabel,
  badge,
  isOpen,
  setIsOpen,
  panelWidth,
  children,
}: FiltreOverlayButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen]);

  return (
    <div ref={containerRef} className={filterStyles.filterMenu}>
      <button
        type="button"
        className={`fr-btn fr-btn--tertiary fr-btn--sm ${filterStyles.filterButton}`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {buttonLabel}
        {badge ? <span className={filterStyles.filterBadge}>{badge}</span> : null}
        <i
          className={`${isOpen ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"} fr-icon--sm`}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div className={styles.overlayPanel} style={panelWidth ? { width: panelWidth } : undefined}>
          {children}
        </div>
      )}
    </div>
  );
}
