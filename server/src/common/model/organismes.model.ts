import { STATUT_FIABILISATION_ORGANISME } from "shared";

// Default value
export function defaultValuesOrganisme() {
  return {
    reseaux: [],
    erps: [],
    relatedFormations: [],
    fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.INCONNU,
    ferme: false,
    qualiopi: false,
    prepa_apprentissage: false,
    created_at: new Date(),
    updated_at: new Date(),
  };
}
