import { STATUT_FIABILISATION_COUPLES_UAI_SIRET } from "../../../common/constants/fiabilisationConstants.js";
import { fiabilisationUaiSiretDb } from "../../../common/model/collections.js";

/**
 * Fonction d'ajout/update des couples de fiabilisation manuelles
 * @returns
 */
export const addFiabilisationsManuelles = async () => {
  await Promise.all(
    FIABILISATIONS_MANUELLES.map(async ({ uai, siret, siret_fiable, uai_fiable }) => {
      await fiabilisationUaiSiretDb().updateOne(
        { uai, siret } as any,
        {
          $set: {
            siret_fiable: siret_fiable,
            uai_fiable: uai_fiable,
            type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
          },
        },
        { upsert: true }
      );
    })
  );
};

/**
 * Liste des couples fiabilisés manuellement
 */
const FIABILISATIONS_MANUELLES = [
  {
    uai: "0562038L",
    siret: undefined,
    uai_fiable: "0562038L",
    siret_fiable: "19561718800485",
    type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
  },
];
