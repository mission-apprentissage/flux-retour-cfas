import cliProgress from "cli-progress";
import logger from "../../../../common/logger.js";
import { getDbCollection } from "../../../../common/mongodb.js";
import { asyncForEach } from "../../../../common/utils/asyncUtils.js";
import {
  DUPLICATE_COLLECTION_NAMES,
  DUPLICATE_TYPE_CODES,
  getDuplicatesList,
} from "../dossiersApprenants.duplicates.actions.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Identification des doublons d'UAIs
 * Construit une collection dossiersApprenantsDoublonsUais contenant les doublons
 * @param {*} param0
 */
export const identifyUaisDuplicates = async (effectifs) => {
  logger.info("Run identification dossiersApprenants with duplicates uais...");

  const resultsCollection = getDbCollection(DUPLICATE_COLLECTION_NAMES.dossiersApprenantsDoublonsUais);
  await resultsCollection.deleteMany({});

  // Identify all uais duplicates
  const uaisDuplicates = await getDuplicatesList(
    DUPLICATE_TYPE_CODES.uai_etablissement.code,
    {},
    { allowDiskUse: true }
  );
  loadingBar.start(uaisDuplicates.length, 0);

  // Calcul for total statuts & for this current duplicate
  let total = {
    nbApprentis: 0,
    nbInscritsSansContrats: 0,
    nbRupturants: 0,
    nbAbandons: 0,
  };

  // Create entry for each duplicate
  await asyncForEach(uaisDuplicates, async (currentDuplicate) => {
    loadingBar.increment();

    // Calcul de chaque effectif à la date du jour pour le groupe de doublons
    const calculDate = new Date();

    const { nbApprentis, nbInscritsSansContrats, nbRupturants, nbAbandons } = {
      nbApprentis: await effectifs.apprentis.getCountAtDate(calculDate, currentDuplicate.commonData),
      nbRupturants: await effectifs.rupturants.getCountAtDate(calculDate, currentDuplicate.commonData),
      nbInscritsSansContrats: await effectifs.inscritsSansContrats.getCountAtDate(
        calculDate,
        currentDuplicate.commonData
      ),
      nbAbandons: await effectifs.abandons.getCountAtDate(calculDate, currentDuplicate.commonData),
    };

    // Update du total
    total.nbApprentis += nbApprentis;
    total.nbInscritsSansContrats += nbInscritsSansContrats;
    total.nbApprentis += nbRupturants;
    total.nbApprentis += nbAbandons;

    await resultsCollection.insertOne({
      type: "Doublons d'UAI",
      champs_communs: currentDuplicate.commonData,
      nb_doublons: currentDuplicate.duplicatesCount,
      uais: currentDuplicate.discriminants.uais,
      ids_doublons: currentDuplicate.duplicatesIds,
      nb_apprentis_concernes: nbApprentis,
      nb_inscrits_sans_contrat_concerne: nbInscritsSansContrats,
      nb_rupturants_concernes: nbRupturants,
      nb_abandons_concernes: nbAbandons,
    });
  });

  // Ajout d'une entree stats avec le total
  await resultsCollection.insertOne({
    type: "Stats",
    total_apprentis: total.nbApprentis,
    total_inscrits_sans_contrat: total.nbInscritsSansContrats,
    total_rupturants: total.nbRupturants,
    total_abandons: total.nbAbandons,
  });

  loadingBar.stop();
  logger.info("End identification dossiersApprenants with duplicates uais !");
};
