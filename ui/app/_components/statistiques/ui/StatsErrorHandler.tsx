"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { ReactNode } from "react";

interface StatsErrorHandlerProps<T> {
  data: T | undefined;
  error: unknown;
  isLoading: boolean;
  children: ReactNode;
  emptyMessage?: string;
}

export function StatsErrorHandler<T>({
  data,
  error,
  isLoading,
  children,
  emptyMessage = "Aucune donnée n'est disponible pour cette période",
}: StatsErrorHandlerProps<T>) {
  if (error) {
    return (
      <Alert
        severity="error"
        title="Erreur"
        description={error instanceof Error ? error.message : "Une erreur est survenue"}
        className={fr.cx("fr-mb-4w")}
      />
    );
  }

  if (!isLoading && !data) {
    return (
      <Alert
        severity="warning"
        title="Aucune donnée disponible"
        description={emptyMessage}
        className={fr.cx("fr-mb-4w")}
      />
    );
  }

  return <>{children}</>;
}
