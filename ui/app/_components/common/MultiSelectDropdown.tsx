"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
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
  footerClassName?: string;
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
  footerClassName,
  onClose,
  fitContent = false,
  searchable = false,
  searchPlaceholder = "Rechercher",
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  // Ouverture au clavier : le focus va sur la première case une fois la liste rendue
  const focusPremiereCaseRef = useRef(false);
  const [recherche, setRecherche] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // Un clic sur un libellé non focusable donne le focus au premier ancêtre focusable (ex. panneau d'onglet DSFR) :
  // cette perte de focus ne doit pas fermer le panneau comme une sortie au clavier.
  const clicDansLePanneauRef = useRef(false);

  const optionsVisibles =
    searchable && recherche.trim()
      ? options.filter((option) => normaliser(option.label).includes(normaliser(recherche.trim())))
      : options;

  const fermer = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    setRecherche("");
  }, []);

  // Fermeture sans validation : le consommateur en est averti pour réaligner son brouillon.
  const dismiss = useCallback(() => {
    fermer();
    onCloseRef.current?.();
  }, [fermer]);

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

  const focusCase = (index: number) => optionRefs.current[index]?.querySelector("input")?.focus();
  // Une seule case est tabulable (tabindex roulant) : Tab traverse la liste en un arrêt
  const indexActif = Math.min(Math.max(focusedIndex, 0), Math.max(optionsVisibles.length - 1, 0));

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen(true);
          setFocusedIndex(0);
          focusPremiereCaseRef.current = true;
        }
        return;
      }

      // l'espace et Entrée doivent rester disponibles pour la saisie
      const saisieEnCours = e.target === searchRef.current;
      // Entrée et Espace activent les boutons du panneau (tout sélectionner, valider)
      const boutonDuPanneau = e.target instanceof HTMLButtonElement && e.target !== triggerRef.current;
      // Case atteinte au Tab : Espace garde son cochage natif, Entrée coche cette case
      const optionCible = e.target instanceof HTMLInputElement ? e.target.closest('[role="option"]') : null;
      const indexCible = optionCible ? optionRefs.current.indexOf(optionCible as HTMLDivElement) : -1;

      const dernier = optionsVisibles.length - 1;
      const allerA = (index: number) => {
        setFocusedIndex(index);
        focusCase(index);
      };

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          // Depuis la recherche ou le bouton, on entre dans la liste sur la case active
          allerA(indexCible >= 0 ? Math.min(indexCible + 1, dernier) : indexActif);
          break;
        case "ArrowUp":
          e.preventDefault();
          if (indexCible === 0 && searchRef.current) searchRef.current.focus();
          else allerA(Math.max((indexCible >= 0 ? indexCible : indexActif) - 1, 0));
          break;
        case "Home":
        case "End":
          if (indexCible < 0) break;
          e.preventDefault();
          allerA(e.key === "Home" ? 0 : dernier);
          break;
        case "Enter":
        case " ":
          if (saisieEnCours || boutonDuPanneau) break;
          if (indexCible >= 0) {
            setFocusedIndex(indexCible);
            if (e.key === " ") break;
            e.preventDefault();
            handleToggle(optionsVisibles[indexCible].value);
            break;
          }
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < optionsVisibles.length) {
            handleToggle(optionsVisibles[focusedIndex].value);
          }
          break;
        case "Escape":
          e.preventDefault();
          dismiss();
          triggerRef.current?.focus();
          break;
      }
    },
    [isOpen, focusedIndex, indexActif, optionsVisibles, value, dismiss]
  );

  useEffect(() => {
    optionRefs.current[focusedIndex]?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex]);

  useEffect(() => {
    if (isOpen && focusPremiereCaseRef.current) {
      focusPremiereCaseRef.current = false;
      optionRefs.current[0]?.querySelector("input")?.focus();
    }
  }, [isOpen]);

  const displayText = getDisplayText(value, options, placeholder);

  return (
    <div
      className={`${styles.container} ${fitContent ? styles.containerFit : ""}`}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
      onMouseDownCapture={() => {
        clicDansLePanneauRef.current = true;
        setTimeout(() => {
          clicDansLePanneauRef.current = false;
        }, 0);
      }}
      onBlur={(e) => {
        // Tab hors du panneau : on le ferme comme un clic à l'extérieur
        if (clicDansLePanneauRef.current) return;
        if (isOpen && e.relatedTarget && !dropdownRef.current?.contains(e.relatedTarget as Node)) dismiss();
      }}
    >
      {label && <label className="fr-label">{label}</label>}
      <div className={styles.selectWrapper}>
        <button
          ref={triggerRef}
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
          <div className={`${styles.dropdown} ${fitContent ? styles.dropdownFit : ""}`}>
            {(enableSelectAll && optionsVisibles.length > 1) || searchable ? (
              <div className={styles.panelHeader}>
                {enableSelectAll && optionsVisibles.length > 1 && (
                  <Button
                    priority="secondary"
                    size="small"
                    iconId={isAllSelected ? "fr-icon-close-circle-line" : "fr-icon-checkbox-circle-line"}
                    className={styles.selectAllButton}
                    onClick={handleSelectAll}
                  >
                    {isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
                  </Button>
                )}
                {searchable && (
                  <div className="fr-input-wrap fr-icon-search-line">
                    <input
                      ref={searchRef}
                      type="search"
                      className="fr-input"
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
              </div>
            ) : null}
            <div className={styles.dropdownContent} role="listbox" aria-multiselectable="true">
              {searchable && optionsVisibles.length === 0 && (
                <p className={styles.aucunResultat}>Aucun résultat pour « {recherche.trim()} »</p>
              )}
              {optionsVisibles.map((option, index) => (
                <div
                  key={option.value}
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  className={styles.option}
                  role="option"
                  aria-selected={value.includes(option.value)}
                >
                  <Checkbox
                    small
                    options={[
                      {
                        label: option.labelNode ?? option.label,
                        nativeInputProps: {
                          checked: value.includes(option.value),
                          onChange: () => handleToggle(option.value),
                          tabIndex: index === indexActif ? 0 : -1,
                          onFocus: () => setFocusedIndex(index),
                        },
                      },
                    ]}
                  />
                </div>
              ))}
            </div>
            {renderFooter && (
              <div className={`${styles.footer} ${footerClassName ?? ""}`}>{renderFooter({ close: fermer })}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
