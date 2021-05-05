const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { Cfa, StatutCandidat } = require("../../common/model");
const { jobNames } = require("../../common/model/constants/");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Script qui initialise la collection CFAs de référence
 */
runScript(async () => {
  logger.info("Seeding referentiel CFAs");
  await seedUaisValid();
  logger.info("End seeding référentiel CFAs !");
}, jobNames.seedReferentielCfas);

/**
 * Seed des cfas avec UAIs valid
 */
const seedUaisValid = async () => {
  // All distinct valid uais
  const allUais = await StatutCandidat.distinct("uai_etablissement", { uai_etablissement_valid: true });

  logger.info(`Seeding Referentiel CFAs from ${allUais.length} UAIs found in statutsCandidats`);

  loadingBar.start(allUais.length, 0);
  let nbUaiHandled = 0;

  await asyncForEach(allUais, async (currentUai) => {
    loadingBar.update(nbUaiHandled);
    nbUaiHandled++;

    // Gets statut for UAI
    const statutForUai = await StatutCandidat.findOne({ uai_etablissement: currentUai });
    const cfaExistant = await Cfa.findOne({ uai: currentUai }).lean();

    // Create or update CFA
    if (cfaExistant) {
      await updateCfaFromStatutCandidat(cfaExistant._id, statutForUai);
    } else {
      await createCfaFromStatutCandidat(statutForUai);
    }
  });

  loadingBar.stop();
};

/**
 * Create cfa from statut
 * @param {*} statutForCfa
 */
const createCfaFromStatutCandidat = async (statutForCfa) => {
  await new Cfa({
    uai: statutForCfa.uai_etablissement,
    siret: statutForCfa.siret_etablissement_valid ? statutForCfa.siret_etablissement : null,
    nom: statutForCfa.nom_etablissement.trim() ?? null,
    branchement_tdb: true,
    source_seed_cfa: "StatutsCandidats",
    erps: [statutForCfa.source],
    region_nom: statutForCfa.etablissement_nom_region,
    region_num: statutForCfa.etablissement_num_region,
  }).save();
};

/**
 * Update cfa from statut
 * @param {*} statutForCfa
 */
const updateCfaFromStatutCandidat = async (idCfa, statutForCfa) => {
  await Cfa.findOneAndUpdate(
    { _id: idCfa },
    {
      $set: {
        uai: statutForCfa.uai_etablissement,
        nom: statutForCfa.nom_etablissement.trim() ?? null,
        siret: statutForCfa.siret_etablissement_valid ? statutForCfa.siret_etablissement : null,
        branchement_tdb: true,
        source_seed_cfa: "StatutsCandidats",
        erps: [statutForCfa.source],
        region_nom: statutForCfa.etablissement_nom_region,
        region_num: statutForCfa.etablissement_num_region,
      },
    }
  );
};
