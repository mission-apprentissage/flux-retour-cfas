import { DistributiveOmit } from "@emotion/react";

import { Organisation } from "@/common/internal/Organisation";

export type NewOrganisation = DistributiveOmit<Organisation, "_id" | "created_at">;

export type SetterOrganisation = (o: NewOrganisation | null) => void;

export type SetterHideBackNextButton = (o: boolean) => void;

// TODO plutôt supprimer ce système de formulaire un peu commun pour avoir des formulaires d'inscription séparés
// plutôt que des propriétés facultatives juste pour le type OF
export type InscriptionOrganistionChildProps = {
  organisation?: NewOrganisation | null;
  setOrganisation: SetterOrganisation;
  setHideBackNextButtons?: SetterHideBackNextButton;
};
