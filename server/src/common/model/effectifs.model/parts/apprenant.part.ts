import { Effectif } from "shared/models/data/@types";

// Default value
export function defaultValuesApprenant(): { historique_statut: Effectif["apprenant"]["historique_statut"] } {
  return {
    historique_statut: [],
  };
}
