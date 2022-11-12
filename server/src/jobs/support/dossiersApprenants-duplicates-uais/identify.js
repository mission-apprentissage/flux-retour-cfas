import cliProgress from 'cli-progress';
import { runScript } from '../../scriptWrapper';
import logger from '../../../common/logger';
import { asyncForEach } from '../../../common/utils/asyncUtils';
import { JOB_NAMES } from '../../../common/constants/jobsConstants';
import { DUPLICATE_TYPE_CODES } from '../../../common/constants/dossierApprenantConstants';
import { collectionNames } from '../../constants';

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Job d'identification des doublons d'UAIs
 * Construit une collection dossiersApprenantsDoublonsUais contenant les doublons
 */
runScript(async ({ dossiersApprenants, effectifs, db }) => {
  await identifyUaisDuplicates({ dossiersApprenants, effectifs, db });
}, JOB_NAMES.dossiersApprenantsBadHistoryIdentifyAntidated);

const identifyUaisDuplicates = async ({ dossiersApprenants, effectifs, db }) => {
  logger.info("Run identification dossiersApprenants with duplicates uais...");

  const resultsCollection = db.collection(collectionNames.dossiersApprenantsDoublonsUais);
  await resultsCollection.deleteMany({});

  // Identify all uais duplicates
  const uaisDuplicates = await dossiersApprenants.getDuplicatesList(
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
