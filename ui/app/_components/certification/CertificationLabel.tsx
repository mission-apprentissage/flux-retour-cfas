"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";

type Level = "success" | "error" | "warning" | "info";

interface CertificationLabelProps {
  level?: Level;
  value: string | boolean | number | null | undefined;
}

export function CertificationLabel({ value, level = "info" }: CertificationLabelProps) {
  const text = typeof value === "boolean" ? (value ? "OUI" : "NON") : (value ?? "");

  return (
    <Badge severity={level} small noIcon>
      {text}
    </Badge>
  );
}
