"use client";

import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import type { StatsPeriod } from "shared/models/data/nationalStats.model";

import { STATS_LAUNCH_DATE_LABEL } from "../constants";

import styles from "./PeriodSelector.module.css";

export type { StatsPeriod as Period } from "shared/models/data/nationalStats.model";

interface PeriodSelectorProps {
  value: StatsPeriod;
  onChange: (period: StatsPeriod) => void;
  className?: string;
  includeAll?: boolean;
  hideLabel?: boolean;
}

export function PeriodSelector({
  value,
  onChange,
  className,
  includeAll = false,
  hideLabel = false,
}: PeriodSelectorProps) {
  const options = [
    { label: "30 derniers jours", value: "30days" },
    { label: "3 derniers mois", value: "3months" },
  ];

  if (includeAll) {
    options.push({ label: `Depuis le lancement (${STATS_LAUNCH_DATE_LABEL})`, value: "all" });
  }

  return (
    <div className={styles.selector}>
      <Select
        label={hideLabel ? "" : "Période"}
        options={options}
        nativeSelectProps={{
          value,
          onChange: (e) => onChange(e.target.value as StatsPeriod),
          className,
        }}
      />
    </div>
  );
}
