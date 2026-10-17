"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useEffect, useRef, useState } from "react";

import dropdownStyles from "@/app/_components/common/MultiSelectDropdown.module.css";

import styles from "./DateRangeFilter.module.css";

interface DateRangeFilterProps {
  debut?: string;
  fin?: string;
  onChange: (range: { debut?: string; fin?: string }) => void;
  emptyLabel: string;
}

const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR");

/** Plage de dates (AAAA-MM-JJ) appliquée au clic sur « Valider », dans le style des filtres à cases. */
export function DateRangeFilter({ debut, fin, onChange, emptyLabel }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState({ debut: debut ?? "", fin: fin ?? "" });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft({ debut: debut ?? "", fin: fin ?? "" }), [debut, fin, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const label =
    debut || fin ? `${debut ? formatDate(debut) : "…"} - ${fin ? formatDate(fin) : "aujourd'hui"}` : emptyLabel;

  return (
    <div className={`${dropdownStyles.container} ${dropdownStyles.containerFit}`} ref={ref}>
      <div className={dropdownStyles.selectWrapper}>
        <button
          type="button"
          className={`${dropdownStyles.selectButton} ${dropdownStyles.selectButtonFit}`}
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <span className={dropdownStyles.placeholder}>
            <span className="fr-icon-calendar-line fr-icon--sm" aria-hidden="true" /> {label}
          </span>
          <span
            className={`fr-icon-arrow-down-s-line ${dropdownStyles.icon} ${isOpen ? dropdownStyles.iconOpen : ""}`}
          />
        </button>
        {isOpen && (
          <div
            className={`${dropdownStyles.dropdown} ${dropdownStyles.dropdownFit}`}
            role="dialog"
            aria-label="Période d'envoi"
          >
            <div className={styles.panel}>
              <Input
                label="Date de début"
                nativeInputProps={{
                  type: "date",
                  value: draft.debut,
                  max: draft.fin || undefined,
                  onChange: (e) => setDraft((current) => ({ ...current, debut: e.target.value })),
                }}
              />
              <Input
                label="Date de fin"
                nativeInputProps={{
                  type: "date",
                  value: draft.fin,
                  min: draft.debut || undefined,
                  onChange: (e) => setDraft((current) => ({ ...current, fin: e.target.value })),
                }}
              />
            </div>
            <div className={`${dropdownStyles.footer} ${styles.footer}`}>
              <Button
                priority="tertiary no outline"
                size="small"
                onClick={() => {
                  onChange({});
                  setIsOpen(false);
                }}
              >
                Effacer
              </Button>
              <Button
                priority="primary"
                size="small"
                onClick={() => {
                  onChange({ debut: draft.debut || undefined, fin: draft.fin || undefined });
                  setIsOpen(false);
                }}
              >
                Valider
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
