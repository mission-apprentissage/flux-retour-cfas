"use client";

import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { useState, useRef, useEffect } from "react";

import styles from "./DepartementMultiSelect.module.css";

interface DepartementOption {
  value: string;
  label: string;
}

interface DepartementMultiSelectProps {
  label: string;
  options: DepartementOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function DepartementMultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
}: DepartementMultiSelectProps) {
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

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === options.length && options.length > 0) return "Tous les départements";
    if (value.length === 1) return options.find((opt) => opt.value === value[0])?.label || placeholder;
    if (value.length <= 3) return value.map((v) => options.find((opt) => opt.value === v)?.label || v).join(", ");
    return `${value.length} département${value.length > 1 ? "s" : ""} sélectionné${value.length > 1 ? "s" : ""}`;
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <label className="fr-label">{label}</label>
      <div className={styles.selectWrapper}>
        <button
          type="button"
          className={`fr-select ${styles.selectButton}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={value.length === 0 ? styles.placeholder : ""}>{getDisplayText()}</span>
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
