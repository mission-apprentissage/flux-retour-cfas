"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useEffect, useState } from "react";

import { MultiSelectDropdown } from "@/app/_components/common/MultiSelectDropdown";

import styles from "./ChecklistFilter.module.css";

interface ChecklistFilterProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string[];
  onChange: (value: string[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  getDisplayText?: (selected: string[]) => string;
  enableSelectAll?: boolean;
}

/** Liste à cases appliquée au clic sur « Valider » ; fermer sans valider abandonne le brouillon. */
export function ChecklistFilter({
  label,
  options,
  value,
  onChange,
  searchable,
  searchPlaceholder,
  getDisplayText,
  enableSelectAll,
}: ChecklistFilterProps) {
  const [draft, setDraft] = useState(value);
  const valueKey = value.join(",");

  useEffect(() => {
    setDraft(valueKey ? valueKey.split(",") : []);
  }, [valueKey]);

  return (
    <div className={styles.filter}>
      <MultiSelectDropdown
        options={options}
        value={draft}
        onChange={setDraft}
        placeholder={label}
        getDisplayText={getDisplayText ? () => getDisplayText(value) : undefined}
        fitContent
        searchable={searchable}
        enableSelectAll={enableSelectAll}
        searchPlaceholder={searchPlaceholder}
        onClose={() => setDraft(value)}
        footerClassName={styles.footer}
        renderFooter={({ close }) => (
          <Button
            priority="primary"
            size="small"
            className={styles.submit}
            onClick={() => {
              onChange(draft);
              close();
            }}
          >
            Valider
          </Button>
        )}
      />
    </div>
  );
}
