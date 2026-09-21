"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { ReactNode } from "react";

interface StatsErrorHandlerProps<T> {
  data: T | undefined;
  error: unknown;
  isLoading: boolean;
  children?: ReactNode;
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
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 401 || statusCode === 403) {
      return (
        <Alert
          severity="warning"
          title="Accès non autorisé"
          description="Ces données ne font pas partie de votre périmètre. Vous pouvez consulter les régions et Missions Locales rattachées à votre organisation."
          className={fr.cx("fr-mb-4w")}
        />
      );
    }
    const prettyMessage = (error as { prettyMessage?: string }).prettyMessage;
    return (
      <Alert
        severity="error"
        title="Erreur"
        description={prettyMessage ?? "Une erreur technique est survenue"}
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
