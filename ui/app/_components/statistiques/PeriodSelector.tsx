"use client";

import { Select } from "@codegouvfr/react-dsfr/SelectNext";

export type Period = "30days" | "3months" | "all";

interface PeriodSelectorProps {
  value: string;
  onChange: (period: any) => void;
  className?: string;
  includAll?: boolean;
  hideLabel?: boolean;
}

const PERIOD_LABELS: Record<string, string> = {
  "30days": "30 derniers jours",
  "3months": "3 derniers mois",
  all: "depuis le lancement (février 2025)",
};

export function PeriodSelector({
  value,
  onChange,
  className,
  includAll = false,
  hideLabel = false,
}: PeriodSelectorProps) {
  const options = [
    { label: PERIOD_LABELS["30days"], value: "30days" },
    { label: PERIOD_LABELS["3months"], value: "3months" },
  ];

  if (includAll) {
    options.push({ label: PERIOD_LABELS["all"], value: "all" });
  }

  return (
    <Select
      label={hideLabel ? "" : "Période"}
      options={options}
      nativeSelectProps={{
        value,
        onChange: (e) => onChange(e.target.value),
        className,
      }}
    />
  );
}
