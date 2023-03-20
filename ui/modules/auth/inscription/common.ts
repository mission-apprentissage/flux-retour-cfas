import { Organisation } from "@/common/internal/Organisation";
import { DistributiveOmit } from "@emotion/react";

export type NewOrganisation = DistributiveOmit<Organisation, "_id" | "created_at">;

export type SetterOrganisation = (o: NewOrganisation | null) => void; // eslint-disable-line no-unused-vars
export type InscriptionOrganistionChildProps = { organisation: NewOrganisation; setOrganisation: SetterOrganisation };

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
