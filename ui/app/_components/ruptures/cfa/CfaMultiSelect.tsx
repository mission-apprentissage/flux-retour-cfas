"use client";

import { MultiSelectDropdown } from "@/app/_components/common/MultiSelectDropdown";

interface Option {
  value: string;
  label: string;
}

interface CfaMultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function CfaMultiSelect({ options, value, onChange, placeholder = "Sélectionner..." }: CfaMultiSelectProps) {
  return <MultiSelectDropdown options={options} value={value} onChange={onChange} placeholder={placeholder} />;
}
