"use client";

import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

import styles from "./MultiSelectDropdown.module.css";

interface Option {
  value: string;
  label: string;
  // Rendu riche optionnel de l'option (ex: mise en gras d'une partie). `label` reste le texte
  // de repli, utilisé pour l'affichage du bouton (getDisplayText) et l'accessibilité.
  labelNode?: ReactNode;
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
  fitContent?: boolean;
  /** Affiche un champ de recherche pour filtrer les options (listes longues). */
  searchable?: boolean;
  searchPlaceholder?: string;
}

function defaultDisplayText(_selected: string[], _options: Option[], placeholder: string): string {
  return placeholder;
}

/** insensible à la casse et aux accents : « merignac » retrouve « Mérignac » */
const normaliser = (texte: string) => texte.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

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
  fitContent = false,
  searchable = false,
  searchPlaceholder = "Rechercher",
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [recherche, setRecherche] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const optionsVisibles =
    searchable && recherche.trim()
      ? options.filter((option) => normaliser(option.label).includes(normaliser(recherche.trim())))
      : options;

  const dismiss = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    setRecherche("");
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

  // avec une recherche active, la sélection globale ne porte que sur les options visibles
  const valeursVisibles = optionsVisibles.map((o) => o.value);
  const isAllSelected = optionsVisibles.length > 0 && valeursVisibles.every((v) => value.includes(v));
  const handleSelectAll = () => {
    if (isAllSelected) {
      onChange(value.filter((v) => !valeursVisibles.includes(v)));
      return;
    }
    onChange([...value, ...valeursVisibles.filter((v) => !value.includes(v))]);
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

      // l'espace et Entrée doivent rester disponibles pour la saisie
      const saisieEnCours = e.target === searchRef.current;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev < optionsVisibles.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
        case " ":
          if (saisieEnCours) break;
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < optionsVisibles.length) {
            handleToggle(optionsVisibles[focusedIndex].value);
          }
          break;
        case "Escape":
          e.preventDefault();
          dismiss();
          break;
      }
    },
    [isOpen, focusedIndex, optionsVisibles, value, dismiss]
  );

  useEffect(() => {
    if (focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  const displayText = getDisplayText(value, options, placeholder);

  return (
    <div
      className={`${styles.container} ${fitContent ? styles.containerFit : ""}`}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      {label && <label className="fr-label">{label}</label>}
      <div className={styles.selectWrapper}>
        <button
          type="button"
          className={`${styles.selectButton} ${fitContent ? styles.selectButtonFit : ""}`}
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
          <div
            className={`${styles.dropdown} ${fitContent ? styles.dropdownFit : ""}`}
            role="listbox"
            aria-multiselectable="true"
          >
            {searchable && (
              <div className={styles.searchRow}>
                <input
                  ref={searchRef}
                  type="search"
                  className={`fr-input ${styles.searchInput}`}
                  placeholder={searchPlaceholder}
                  value={recherche}
                  aria-label={searchPlaceholder}
                  onChange={(e) => {
                    setRecherche(e.target.value);
                    setFocusedIndex(0);
                  }}
                />
              </div>
            )}
            <div className={styles.dropdownContent}>
              {searchable && optionsVisibles.length === 0 && (
                <p className={styles.aucunResultat}>Aucun résultat pour « {recherche.trim()} »</p>
              )}
              {enableSelectAll && optionsVisibles.length > 1 && (
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
              {optionsVisibles.map((option, index) => (
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
                        label: option.labelNode ?? option.label,
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
