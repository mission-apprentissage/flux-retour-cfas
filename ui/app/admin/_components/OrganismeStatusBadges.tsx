"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { STATUT_FIABILISATION_ORGANISME, STATUT_PRESENCE_REFERENTIEL } from "shared";

export function FiabilisationBadge({ statut }: { statut?: string | null }) {
  const isFiable = statut === STATUT_FIABILISATION_ORGANISME.FIABLE;

  return (
    <Badge severity={isFiable ? "success" : "error"} small>
      {isFiable ? "Fiable" : "Non fiable"}
    </Badge>
  );
}

export function EtatOrganismeBadge({ ferme }: { ferme?: boolean | null }) {
  return (
    <Badge severity={ferme ? "error" : "success"} small>
      {ferme ? "Fermé" : "Ouvert"}
    </Badge>
  );
}

export function ReferentielBadge({ statut }: { statut?: string | null }) {
  const isPresent = statut === STATUT_PRESENCE_REFERENTIEL.PRESENT;

  return (
    <Badge severity={isPresent ? "success" : "error"} small>
      {isPresent ? "Présent" : "Absent"}
    </Badge>
  );
}
