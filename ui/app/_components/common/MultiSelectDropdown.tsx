"use client";

import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

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
  enableSelectAll?: boolean;
  renderFooter?: (api: { close: () => void }) => ReactNode;
  onClose?: () => void;
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
  enableSelectAll = false,
  renderFooter,
  onClose,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const dismiss = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    onCloseRef.current?.();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        dismiss();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dismiss]);

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const isAllSelected = options.length > 0 && value.length === options.length;
  const handleSelectAll = () => {
    onChange(isAllSelected ? [] : options.map((o) => o.value));
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen(true);
          setFocusedIndex(0);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            handleToggle(options[focusedIndex].value);
          }
          break;
        case "Escape":
          e.preventDefault();
          dismiss();
          break;
      }
    },
    [isOpen, focusedIndex, options, value, dismiss]
  );

  useEffect(() => {
    if (focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  const displayText = getDisplayText(value, options, placeholder);

  return (
    <div className={styles.container} ref={dropdownRef} onKeyDown={handleKeyDown}>
      {label && <label className="fr-label">{label}</label>}
      <div className={styles.selectWrapper}>
        <button
          type="button"
          className={styles.selectButton}
          onClick={() => {
            if (isOpen) {
              dismiss();
            } else {
              setIsOpen(true);
              setFocusedIndex(0);
            }
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={styles.placeholder}>{displayText}</span>
          <span className={`fr-icon-arrow-down-s-line ${styles.icon} ${isOpen ? styles.iconOpen : ""}`} />
        </button>

        {isOpen && (
          <div className={styles.dropdown} role="listbox" aria-multiselectable="true">
            <div className={styles.dropdownContent}>
              {enableSelectAll && options.length > 1 && (
                <div
                  className={`${styles.option} ${styles.selectAllOption}`}
                  role="option"
                  aria-selected={isAllSelected}
                >
                  <Checkbox
                    options={[
                      {
                        label: isAllSelected ? "Tout désélectionner" : "Tout sélectionner",
                        nativeInputProps: {
                          checked: isAllSelected,
                          onChange: handleSelectAll,
                        },
                      },
                    ]}
                  />
                </div>
              )}
              {options.map((option, index) => (
                <div
                  key={option.value}
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  className={`${styles.option} ${index === focusedIndex ? styles.optionFocused : ""}`}
                  role="option"
                  aria-selected={value.includes(option.value)}
                >
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
            {renderFooter && <div className={styles.footer}>{renderFooter({ close: () => setIsOpen(false) })}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
