"use client";

import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { useEffect, useRef, useState } from "react";

import styles from "./organismes.module.scss";

interface FilterCheckboxMenuOption {
  value: string;
  label: string;
}

interface FilterCheckboxMenuProps {
  buttonLabel: string;
  options: FilterCheckboxMenuOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function FilterCheckboxMenu({ buttonLabel, options, value, onChange }: FilterCheckboxMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
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
  }, [isOpen]);

  const toggleValue = (optionValue: string, checked: boolean) => {
    onChange(checked ? [...value, optionValue] : value.filter((v) => v !== optionValue));
  };

  return (
    <div ref={containerRef} className={styles.filterMenu}>
      <button
        type="button"
        className={`fr-btn fr-btn--tertiary fr-btn--sm ${styles.filterButton}`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {buttonLabel}
        {value.length > 0 && <span className={styles.filterBadge}>{value.length}</span>}
        <i
          className={`${isOpen ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"} fr-icon--sm`}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div className={styles.filterOverlay}>
          <Checkbox
            small
            options={options.map((option) => ({
              label: option.label,
              nativeInputProps: {
                checked: value.includes(option.value),
                onChange: (event) => toggleValue(option.value, event.target.checked),
              },
            }))}
          />
        </div>
      )}
    </div>
  );
}
