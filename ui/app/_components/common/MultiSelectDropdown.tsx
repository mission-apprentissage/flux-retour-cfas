"use client";

import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { useEffect, useRef, useState } from "react";

import styles from "./MultiSelectDropdown.module.css";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  getDisplayText?: (selected: string[], options: Option[], placeholder: string) => string;
}

function defaultDisplayText(_selected: string[], _options: Option[], placeholder: string): string {
  return placeholder;
}

export function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
  label,
  getDisplayText = defaultDisplayText,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const displayText = getDisplayText(value, options, placeholder);

  return (
    <div className={styles.container} ref={dropdownRef}>
      {label && <label className="fr-label">{label}</label>}
      <div className={styles.selectWrapper}>
        <button
          type="button"
          className={styles.selectButton}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={styles.placeholder}>{displayText}</span>
          <span className={`fr-icon-arrow-down-s-line ${styles.icon} ${isOpen ? styles.iconOpen : ""}`} />
        </button>

        {isOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownContent}>
              {options.map((option) => (
                <div key={option.value} className={styles.option}>
                  <Checkbox
                    options={[
                      {
                        label: option.label,
                        nativeInputProps: {
                          checked: value.includes(option.value),
                          onChange: () => handleToggle(option.value),
                        },
                      },
                    ]}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
