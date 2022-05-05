const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");
const { EFFECTIF_INDICATOR_NAMES } = require("../../common/constants/dossierApprenantConstants");
const { EffectifApprenantModel } = require("../../common/model");
const { getAnneesScolaireListFromDate } = require("../../common/utils/anneeScolaireUtils");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const cliProgress = require("cli-progress");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de créer la collection Effectifs Apprenants
 */
runScript(async ({ effectifs }) => {
  logger.info("Create Effectifs Apprenants Collection");

  // Supprime les données précédentes
  logger.info(`Clearing existing Effectifs Apprenants Collection ...`);
  await EffectifApprenantModel.deleteMany({});

  const currentAnneeScolaireFilter = { annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) } };
  const projection = {
    uai_etablissement: 1,
    nom_etablissement: 1,
    etablissement_formateur_code_commune_insee: 1,
    etablissement_code_postal: 1,
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
    await new EffectifApprenantModel({
      dossierApprenantId: currentStatut.dossierApprenantId,
      uai_etablissement: currentStatut.uai_etablissement,
      nom_etablissement: currentStatut.nom_etablissement,
      etablissement_formateur_code_commune_insee: currentStatut.etablissement_formateur_code_commune_insee,
      etablissement_code_postal: currentStatut.etablissement_code_postal,
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
    }).save();
    loadingBar.increment();
  });

  loadingBar.stop();
}, JOB_NAMES.createEffectifsApprenantsCollection);
