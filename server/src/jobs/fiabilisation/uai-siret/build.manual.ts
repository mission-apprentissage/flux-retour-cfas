import { STATUT_FIABILISATION_COUPLES_UAI_SIRET } from "shared";

import { fiabilisationUaiSiretDb } from "@/common/model/collections";

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
            siret_fiable,
            uai_fiable,
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
  {
    uai: "0572998Z",
    siret: "19570099200041",
    uai_fiable: "0572998Z",
    siret_fiable: "19570099200074",
    type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
  },
  {
    uai: "0763153P",
    siret: "40112310400010",
    uai_fiable: "0763153P",
    siret_fiable: "40112310400069",
    type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
  },
  {
    uai: "0691696U",
    siret: "77572257200036",
    uai_fiable: "0691696U",
    siret_fiable: "77572257201190",
    type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
  },
];
