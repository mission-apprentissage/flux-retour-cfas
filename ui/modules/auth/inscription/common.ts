import { DistributiveOmit } from "@emotion/react";

import { Organisation } from "@/common/internal/Organisation";

export type NewOrganisation = DistributiveOmit<Organisation, "_id" | "created_at">;

export type SetterOrganisation = (o: NewOrganisation | null) => void;

// TODO plutôt supprimer ce système de formulaire un peu commun pour avoir des formulaires d'inscription séparés
// plutôt que des propriétés facultatives juste pour le type OF
export type InscriptionOrganistionChildProps = {
  organisation?: NewOrganisation | null;
  setOrganisation: SetterOrganisation;
};

export const natureOFToOrganisationType = {
  responsable_formateur: "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR",
  responsable: "ORGANISME_FORMATION_RESPONSABLE",
  formateur: "ORGANISME_FORMATION_FORMATEUR",
  inconnue: "ORGANISME_FORMATION_FORMATEUR",
} as const;

export function getOrganisationTypeFromNature(
  nature: keyof typeof natureOFToOrganisationType
): (typeof natureOFToOrganisationType)[typeof nature] {
  return natureOFToOrganisationType[nature] || "ORGANISME_FORMATION_FORMATEUR";
}
