const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { jobNames } = require("../../common/model/constants");
const { CfaAnnuaireModel, CroisementCfasAnnuaireModel, CfaModel } = require("../../common/model");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Script qui initialise la collection CFAs CroisementCfasAnnuaire
 */
runScript(async ({ cfas }) => {
  logger.info("Seeding croisement CFAs Annuaire");
  await seedCroisementCfasAnnuaire(cfas);
  logger.info("End seeding croisement CFAs Annuaire");
}, jobNames.seedCroisementCfasAnnuaire);

/**
 * Seed du croisement des CFAS Annuaire / Tdb
 */
const seedCroisementCfasAnnuaire = async () => {
  // Clear if existing annuaire cfa collection
  logger.info(`Clearing existing CroisementCfasAnnuaireTdb collection ...`);
  await CroisementCfasAnnuaireModel.deleteMany({});

  const cfasAnnuaire = await CfaAnnuaireModel.find({}).lean();
  logger.info(`Seeding Croisement CFAs Annuaire from ${cfasAnnuaire.length} CFAs in annuaire`);

  loadingBar.start(cfasAnnuaire.length, 0);

  await asyncForEach(cfasAnnuaire, async (currentCfaAnnuaire) => {
    loadingBar.increment();

    if (currentCfaAnnuaire.gestionnaire) {
      await searchCroisementSiretResponsable(currentCfaAnnuaire);
    }

    if (currentCfaAnnuaire.formateur) {
      await searchCroisementSiretFormateur(currentCfaAnnuaire);
    }

    if (currentCfaAnnuaire.uais) {
      await searchCroisementUais(currentCfaAnnuaire);
    }
  });

  loadingBar.stop();
};

/**
 *
 */
const searchCroisementSiretResponsable = async (currentCfaAnnuaire) => {
  const cfaInTdb = await CfaModel.findOne({ siret: currentCfaAnnuaire.siret }).lean();
  if (cfaInTdb) {
    await new CroisementCfasAnnuaireModel({
      annuaire_siret_responsable: currentCfaAnnuaire.siret,
      annuaire_nom_associé: currentCfaAnnuaire.raison_sociale,
      present_tdb_match_siret_responsable: true,
      tdb_nom_associé: cfaInTdb.nom,
    }).save();
  }
};

/**
 *
 */
const searchCroisementSiretFormateur = async (currentCfaAnnuaire) => {
  const cfaInTdb = await CfaModel.findOne({ siret: currentCfaAnnuaire.siret }).lean();
  if (cfaInTdb) {
    await new CroisementCfasAnnuaireModel({
      annuaire_siret_formateur: currentCfaAnnuaire.siret,
      annuaire_nom_associé: currentCfaAnnuaire.raison_sociale,
      present_tdb_match_siret_formateur: true,
      tdb_nom_associé: cfaInTdb.nom,
    }).save();
  }
};

/**
 *
 */
const searchCroisementUais = async (currentCfaAnnuaire) => {
  const cfaInTdb = await CfaModel.findOne({ uai: { $in: currentCfaAnnuaire.uais } }).lean();
  if (cfaInTdb) {
    await new CroisementCfasAnnuaireModel({
      annuaire_uai: cfaInTdb.uai,
      annuaire_nom_associé: currentCfaAnnuaire.raison_sociale,
      present_tdb_match_uai: true,
      tdb_nom_associé: cfaInTdb.nom,
    }).save();
  }
};
