"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useEffect, useMemo, useState } from "react";

import { MultiSelectDropdown } from "@/app/_components/common/MultiSelectDropdown";
import { PostalCodeOption } from "@/app/_utils/ruptures.utils";

import styles from "./VillesFilter.module.css";

type VillesFilterProps = {
  options: PostalCodeOption[];
  value: string[];
  onChange: (value: string[]) => void;
};

const EMPTY_SELECTION_MESSAGE = "Sélectionnez au moins une commune pour pouvoir afficher des résultats.";

export function VillesFilter({ options, value, onChange }: VillesFilterProps) {
  const allValues = useMemo(() => options.map((o) => o.value), [options]);

  // Sélection "brouillon" (cases cochées dans le dropdown) : toutes les villes cochées par défaut
  const [draft, setDraft] = useState<string[]>(value.length > 0 ? value : allValues);

  useEffect(() => {
    setDraft(value.length > 0 ? value : allValues);
  }, [value, allValues]);

  const isDraftEmpty = draft.length === 0;

  const handleValidate = () => {
    if (isDraftEmpty) return;
    // Toutes les villes cochées = pas de filtre (tous les dossiers affichés, aucune étiquette).
    onChange(draft.length === allValues.length ? [] : draft);
  };

  return (
    <div className={styles.selectField}>
      <MultiSelectDropdown
        options={options}
        value={draft}
        onChange={setDraft}
        placeholder="Villes"
        fitContent
        enableSelectAll
        searchable
        searchPlaceholder="Rechercher une commune"
        // Fermeture sans valider = abandon : on réaligne le brouillon sur la sélection appliquée.
        onClose={() => setDraft(value.length > 0 ? value : allValues)}
        renderFooter={({ close }) => (
          <>
            <Button
              priority="primary"
              size="small"
              disabled={isDraftEmpty}
              onClick={() => {
                handleValidate();
                close();
              }}
              className={styles.submitButton}
            >
              Valider
            </Button>
            {isDraftEmpty && (
              <div className={styles.emptyMessageContainer}>
                <i className={`ri-information-fill fr-icon--sm ${styles.emptyMessageIcon}`} aria-hidden="true" />
                <p className={styles.emptyMessageText}>{EMPTY_SELECTION_MESSAGE}</p>
              </div>
            )}
          </>
        )}
      />
    </div>
  );
}
