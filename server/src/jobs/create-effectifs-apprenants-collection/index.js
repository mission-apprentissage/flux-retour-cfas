import { runScript } from "../scriptWrapper.js";
import logger from "../../common/logger.js";
import { JOB_NAMES } from "../../common/constants/jobsConstants.js";
import { EFFECTIF_INDICATOR_NAMES } from "../../common/constants/dossierApprenantConstants.js";
import { getAnneesScolaireListFromDate } from "../../common/utils/anneeScolaireUtils.js";
import { asyncForEach } from "../../common/utils/asyncUtils.js";
import cliProgress from "cli-progress";
import { effectifsApprenantsDb } from "../../common/model/collections.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de créer la collection Effectifs Apprenants
 */
runScript(async ({ effectifs }) => {
  logger.info("Create Effectifs Apprenants Collection");

  // Supprime les données précédentes
  logger.info(`Clearing existing Effectifs Apprenants Collection ...`);
  await effectifsApprenantsDb().deleteMany({});

  const currentAnneeScolaireFilter = { annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) } };
  const projection = {
    uai_etablissement: 1,
    nom_etablissement: 1,
    formation_cfd: 1,
    periode_formation: 1,
    annee_formation: 1,
    annee_scolaire: 1,
    code_commune_insee_apprenant: 1,
    date_de_naissance_apprenant: 1,
    contrat_date_debut: 1,
    contrat_date_fin: 1,
    contrat_date_rupture: 1,
    formation_rncp: 1,
  };

  // Récupère la liste des données pour chaque indicateur du TdB et ajoute l'id original + un flag d'indicateur concerné
  logger.info(`Building Effectifs Apprenants Collection ...`);

  const apprentis = (
    await effectifs.apprentis.getListAtDate(new Date(), currentAnneeScolaireFilter, { projection })
  ).map((item) => ({ ...item, dossierApprenantId: item._id, indicateur_effectif: EFFECTIF_INDICATOR_NAMES.apprentis }));

  const inscritsSansContrats = (
    await effectifs.inscritsSansContrats.getListAtDate(new Date(), currentAnneeScolaireFilter, { projection })
  ).map((item) => ({
    ...item,
    dossierApprenantId: item._id,
    indicateur_effectif: EFFECTIF_INDICATOR_NAMES.inscritsSansContrats,
  }));

  const rupturants = (
    await effectifs.rupturants.getListAtDate(new Date(), currentAnneeScolaireFilter, { projection })
  ).map((item) => ({
    ...item,
    dossierApprenantId: item._id,
    indicateur_effectif: EFFECTIF_INDICATOR_NAMES.rupturants,
  }));

  const abandons = (await effectifs.abandons.getListAtDate(new Date(), currentAnneeScolaireFilter, { projection })).map(
    (item) => ({ ...item, dossierApprenantId: item._id, indicateur_effectif: EFFECTIF_INDICATOR_NAMES.abandons })
  );

  // Construction de la liste totale des données avec flag de chaque indicateur
  const allStatutsByIndicators = [...apprentis, ...inscritsSansContrats, ...rupturants, ...abandons];
  loadingBar.start(allStatutsByIndicators.length, 0);

  // Ajout en base pour chaque élément de la liste
  await asyncForEach(allStatutsByIndicators, async (currentStatut) => {
    await effectifsApprenantsDb().insertOne({
      dossierApprenantId: currentStatut.dossierApprenantId.toString(),
      uai_etablissement: currentStatut.uai_etablissement,
      nom_etablissement: currentStatut.nom_etablissement,
      formation_cfd: currentStatut.formation_cfd,
      periode_formation: currentStatut.periode_formation,
      annee_formation: currentStatut.annee_formation,
      annee_scolaire: currentStatut.annee_scolaire,
      code_commune_insee_apprenant: currentStatut.code_commune_insee_apprenant,
      date_de_naissance_apprenant: currentStatut.date_de_naissance_apprenant,
      contrat_date_debut: currentStatut.contrat_date_debut,
      contrat_date_fin: currentStatut.contrat_date_fin,
      contrat_date_rupture: currentStatut.contrat_date_rupture,
      formation_rncp: currentStatut.formation_rncp,
      indicateur_effectif: currentStatut.indicateur_effectif,
      created_at: new Date(),
    });
    loadingBar.increment();
  });

  loadingBar.stop();
}, JOB_NAMES.createEffectifsApprenantsCollection);
