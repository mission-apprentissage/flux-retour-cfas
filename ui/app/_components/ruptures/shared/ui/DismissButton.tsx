"use client";

import styles from "./DismissButton.module.css";

interface DismissButtonProps {
  onDismiss: () => void;
  label: string;
  className?: string;
}

export function DismissButton({ onDismiss, label, className }: DismissButtonProps) {
  return (
    <button
      type="button"
      className={className ? `${styles.button} ${className}` : styles.button}
      onClick={onDismiss}
      aria-label={label}
    >
      <span className="fr-icon-close-line" aria-hidden="true" />
    </button>
  );
}
