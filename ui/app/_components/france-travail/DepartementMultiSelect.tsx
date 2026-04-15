"use client";

import { MultiSelectDropdown } from "@/app/_components/common/MultiSelectDropdown";

interface DepartementOption {
  value: string;
  label: string;
}

interface DepartementMultiSelectProps {
  label: string;
  options: DepartementOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

function departementDisplayText(selected: string[], options: DepartementOption[], placeholder: string): string {
  if (selected.length === 0) return placeholder;
  if (selected.length === options.length && options.length > 0) return "Tous les départements";
  if (selected.length === 1) return options.find((opt) => opt.value === selected[0])?.label || placeholder;
  if (selected.length <= 3) {
    return selected.map((v) => options.find((opt) => opt.value === v)?.label || v).join(", ");
  }
  return `${selected.length} département${selected.length > 1 ? "s" : ""} sélectionné${selected.length > 1 ? "s" : ""}`;
}

export function DepartementMultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
}: DepartementMultiSelectProps) {
  return (
    <MultiSelectDropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      label={label}
      getDisplayText={departementDisplayText}
    />
  );
}
