"use client";

import { Select } from "@codegouvfr/react-dsfr/SelectNext";

export type Period = "30days" | "3months" | "all";

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
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
  const options = [{ label: "30 derniers jours", value: "30days" }];

  if (includeAll) {
    options.push({ label: "Depuis le lancement (février 2025)", value: "all" });
  }

  return (
    <Select
      label={hideLabel ? "" : "Période"}
      options={options}
      nativeSelectProps={{
        value,
        onChange: (e) => onChange(e.target.value as Period),
        className,
      }}
    />
  );
}
