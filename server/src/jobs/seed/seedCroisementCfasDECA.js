const cliProgress = require("cli-progress");
const path = require("path");
const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { jobNames } = require("../../common/model/constants");
const { downloadIfNeeded } = require("./utils/seedUtils");
const { CroisementCfasDeca, Cfa } = require("../../common/model");
const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const decaFilePath = path.join(__dirname, `./assets/donnees_deca_2021.csv`);

/**
 * Script qui initialise la collection CFAs de l'annuaire
 */
runScript(async ({ dashboard }) => {
  logger.info("Seeding CroisementsCfasDECA...");
  await seedCroisementCfasDeca(dashboard);
  logger.info("End seeding CroisementsCfasDECA...");
}, jobNames.cfasCroisementDeca);

/**
 * Seed des croisements des CFAs avec le fichier DECA
 */
const seedCroisementCfasDeca = async (dashboard) => {
  // Clear if existing croisement deca cfa collection
  logger.info(`Clearing existing CroisementCFAsDECA collection ...`);
  await CroisementCfasDeca.deleteMany({});

  // Gets the referentiel file
  await downloadIfNeeded(`deca/donnees_deca_2021.csv`, decaFilePath);

  const decaData = readJsonFromCsvFile(decaFilePath, "utf8");
  if (!decaData) {
    logger.error("Error while reading DECA reference file");
    return;
  }

  if (decaData) {
    loadingBar.start(decaData.length, 0);

    await asyncForEach(decaData, async (currentDecaData) => {
      loadingBar.increment();

      // Match on Tdb UAI
      const cfaInTdb = await Cfa.findOne({ uai: currentDecaData.uai }).lean();

      if (cfaInTdb) {
        const nbContratsForUai = await dashboard.getContratsCountAtDate(new Date(Date.now()), {
          uai_etablissement: currentDecaData.uai,
        });
        await new CroisementCfasDeca({
          uai: currentDecaData.uai,
          deca_siret: currentDecaData.siret,
          deca_nom_etablissement: currentDecaData.nom,
          tdb_nom_etablissement: cfaInTdb.nom,
          nb_contrats_deca_2021: currentDecaData.nb_contrats_2021,
          nb_contrats_tdb_2021: nbContratsForUai,
        }).save();
      } else {
        await new CroisementCfasDeca({
          uai: currentDecaData.uai,
          deca_siret: currentDecaData.siret,
          deca_nom_etablissement: currentDecaData.nom,
          nb_contrats_deca_2021: currentDecaData.nb_contrats_2021,
          uai_missing_in_tdb: true,
        }).save();
      }
    });

    loadingBar.stop();
  }
};
