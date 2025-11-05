"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";

import styles from "./DepartementButtonGroup.module.css";
import { IDepartementCountsResponse } from "./types";

interface DepartementOption {
  value: string;
  label: string;
}

interface DepartementButtonGroupProps {
  label: string;
  options: DepartementOption[];
  value: string[];
  onChange: (value: string[]) => void;
  departementCounts?: IDepartementCountsResponse;
  isLoadingCounts?: boolean;
}

export function DepartementButtonGroup({
  label,
  options,
  value,
  onChange,
  departementCounts = {},
  isLoadingCounts = false,
}: DepartementButtonGroupProps) {
  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      const newValue = value.filter((v) => v !== optionValue);
      if (newValue.length > 0) {
        onChange(newValue);
      }
    } else {
      onChange([...value, optionValue]);
    }
  };

  const getDepartementName = (optionLabel: string): string => {
    const parts = optionLabel.split(" - ");
    return parts.length > 1 ? parts[1] : optionLabel;
  };

  const getButtonLabel = (option: DepartementOption): string => {
    const name = getDepartementName(option.label);
    if (isLoadingCounts) {
      return `${name} (...)`;
    }
    const count = departementCounts[option.value] ?? 0;
    return `${name} (${count})`;
  };

  return (
    <div className={styles.wrapper}>
      <label className="fr-label">
        <b>{label}</b>
      </label>
      <div className={styles.buttonsColumn}>
        <div className={styles.buttonContainer}>
          {options.map((option) => {
            const isSelected = value.includes(option.value);
            const buttonLabel = getButtonLabel(option);

            return isSelected ? (
              <Button
                key={option.value}
                priority="secondary"
                iconId="fr-icon-close-line"
                iconPosition="right"
                onClick={() => handleToggle(option.value)}
                className={styles.enabled}
                title={`Retirer le filtre ${option.label}`}
                size="small"
              >
                {buttonLabel}
              </Button>
            ) : (
              <Button
                key={option.value}
                priority="primary"
                onClick={() => handleToggle(option.value)}
                className={styles.disabled}
                title={`Ajouter le filtre ${option.label}`}
                size="small"
              >
                {buttonLabel}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
