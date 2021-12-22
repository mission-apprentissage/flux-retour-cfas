const { runScript } = require("../scriptWrapper");
const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { StatutCandidat, RcoStatutCandidat } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { jobNames, codesStatutsCandidats } = require("../../common/model/constants");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de créer la collection RCO Statuts Candidats
 */
runScript(async () => {
  logger.info("Create RCO Statuts Collection");
  const allStatutsInscrits = await StatutCandidat.find({ statut_apprenant: codesStatutsCandidats.inscrit }).lean();

  // Clear if existing RCO Statuts collection
  logger.info(`Clearing existing RCO Statuts Collection ...`);
  await RcoStatutCandidat.deleteMany({});

  logger.info(`Building rcoStatutsCollection for ${allStatutsInscrits.length} statuts `);
  loadingBar.start(allStatutsInscrits.length, 0);

  await asyncForEach(allStatutsInscrits, async (currentStatut) => {
    await new RcoStatutCandidat({
      statutCandidatId: currentStatut._id,
      uai_etablissement: currentStatut.uai_etablissement,
      nom_etablissement: currentStatut.nom_etablissement,
      etablissement_formateur_code_commune_insee: currentStatut.etablissement_formateur_code_commune_insee,
      etablissement_code_postal: currentStatut.etablissement_code_postal,
      statut_apprenant: currentStatut.statut_apprenant,
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
    }).save();
    loadingBar.increment();
  });

  loadingBar.stop();
}, jobNames.createRcoStatutsCollection);
