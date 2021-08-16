const cliProgress = require("cli-progress");
const path = require("path");
const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { jobNames } = require("../../common/model/constants");
const { downloadIfNeeded } = require("./utils/seedUtils");
const { CfaAnnuaire } = require("../../common/model");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const annuaireJsonFilePath = path.join(__dirname, `./assets/annuaireCfas.json`);

/**
 * Script qui initialise la collection CFAs de l'annuaire
 */
runScript(async ({ cfas }) => {
  logger.info("Seeding annuaire CFAs");
  await seedCfasFromAnnuaireJsonFile(cfas);
  logger.info("End seeding annuaire CFAs !");
}, jobNames.seedAnnuaireCfas);

/**
 * Seed des cfas depuis un fichier JSON annuaire
 */
const seedCfasFromAnnuaireJsonFile = async () => {
  // Clear if existing annuaire cfa collection
  logger.info(`Clearing existing annuaire CFAs collection ...`);
  await CfaAnnuaire.deleteMany({});

  // Gets the referentiel file
  await downloadIfNeeded(`cfas-annuaire/annuaireCfas.json`, annuaireJsonFilePath);

  const cfasAnnuaire = require(annuaireJsonFilePath);

  if (cfasAnnuaire) {
    logger.info(`Seeding Annuaire CFAs from ${cfasAnnuaire.length} CFAs in JSON File`);

    loadingBar.start(cfasAnnuaire.length, 0);

    await asyncForEach(cfasAnnuaire, async (currentCfaAnnuaire) => {
      loadingBar.increment();

      await new CfaAnnuaire({
        siret: currentCfaAnnuaire.siret,
        raison_sociale: currentCfaAnnuaire.raison_sociale,
        uais: currentCfaAnnuaire.uais,
        gestionnaire: currentCfaAnnuaire.gestionnaire,
        formateur: currentCfaAnnuaire.formateur,
        statut: currentCfaAnnuaire.statut,
        relations: currentCfaAnnuaire.relations,

        adresse_label: currentCfaAnnuaire.adresse?.label,
        adresse_code_postal: currentCfaAnnuaire.adresse?.code_postal,
        adresse_code_insee: currentCfaAnnuaire.adresse?.code_insee,
        adresse_region_code: currentCfaAnnuaire.adresse?.region.code,
        adresse_region_nom: currentCfaAnnuaire.adresse?.region.nom,
      }).save();
    });

    loadingBar.stop();
  }
};
