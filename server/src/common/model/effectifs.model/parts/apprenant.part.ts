import { Effectif } from "../../@types";

// Default value
export function defaultValuesApprenant(): { historique_statut: Effectif["apprenant"]["historique_statut"] } {
  return {
    historique_statut: [],
  };
}
