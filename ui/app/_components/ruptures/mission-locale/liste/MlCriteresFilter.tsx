"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { useEffect, useState } from "react";

import { MultiSelectDropdown } from "@/app/_components/common/MultiSelectDropdown";

import styles from "./MlCriteresFilter.module.css";

export const ML_CRITERES = {
  COLLABORATION_CFA: "acc_conjoint",
  RQTH: "rqth",
  MINEURS: "mineur",
  SOUHAITE_RDV: "souhaite_rdv",
} as const;

export type MlCritere = (typeof ML_CRITERES)[keyof typeof ML_CRITERES];

const CRITERE_OPTIONS: { value: MlCritere; label: string }[] = [
  { value: ML_CRITERES.COLLABORATION_CFA, label: "Collaboration CFA" },
  { value: ML_CRITERES.RQTH, label: "RQTH" },
  { value: ML_CRITERES.MINEURS, label: "Mineurs" },
  { value: ML_CRITERES.SOUHAITE_RDV, label: "Souhaite un RDV" },
];

const TOUS_LES_CRITERES = CRITERE_OPTIONS.map(({ value }) => value);

type MlCriteresFilterProps = {
  value: MlCritere[];
  onChange: (value: MlCritere[]) => void;
};

export function MlCriteresFilter({ value, onChange }: MlCriteresFilterProps) {
  const [draft, setDraft] = useState<string[]>(value.length > 0 ? value : TOUS_LES_CRITERES);

  useEffect(() => {
    setDraft(value.length > 0 ? value : TOUS_LES_CRITERES);
  }, [value]);

  const isDraftEmpty = draft.length === 0;

  return (
    <div className={styles.container}>
      <MultiSelectDropdown
        options={CRITERE_OPTIONS}
        value={draft}
        onChange={setDraft}
        placeholder="Critères priorité"
        fitContent
        enableSelectAll
        // fermeture sans valider = abandon
        onClose={() => setDraft(value.length > 0 ? value : TOUS_LES_CRITERES)}
        renderFooter={({ close }) => (
          <Button
            priority="primary"
            size="small"
            disabled={isDraftEmpty}
            onClick={() => {
              // tous cochés = pas de filtre
              onChange(draft.length === TOUS_LES_CRITERES.length ? [] : (draft as MlCritere[]));
              close();
            }}
            className={styles.submitButton}
          >
            Valider
          </Button>
        )}
      />
      {value.length > 0 && (
        <div className={styles.tagsRow}>
          {value.map((critere) => (
            <Tag
              key={critere}
              dismissible
              nativeButtonProps={{ onClick: () => onChange(value.filter((v) => v !== critere)) }}
            >
              {CRITERE_OPTIONS.find(({ value: v }) => v === critere)?.label ?? critere}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
}
