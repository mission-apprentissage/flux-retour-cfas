const cliProgress = require("cli-progress");
const indexBy = require("lodash.indexby");

const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const logger = require("../../common/logger");
const { getDepartementCodeFromUai } = require("../../common/domain/uai");
const { DEPARTEMENTS } = require("../../common/constants/territoiresConstants");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de créer un export contenant les CFAS sans SIRET
 */
runScript(async ({ db }) => {
  const departementsMap = indexBy(DEPARTEMENTS, "uaiCode");
  const allUais = await db.collection("dossiersApprenants").distinct("uai_etablissement");

  logger.info(`${allUais.length} UAI found. Will update matching dossiersApprenants...`);
  loadingBar.start(allUais.length, 0);

  let modifiedCount = 0;
  let matchedCount = 0;

  await asyncForEach(allUais, async (uaiToUpdate) => {
    const infoCodeFromUai = getDepartementCodeFromUai(uaiToUpdate);
    const info = departementsMap[infoCodeFromUai];

    if (!info) return;

    const updateResult = await db.collection("dossiersApprenants").updateMany(
      { uai_etablissement: uaiToUpdate },
      {
        $set: {
          etablissement_num_departement: info.uaiCode,
          etablissement_nom_departement: info.nom,
          etablissement_num_region: info.codeRegion,
          etablissement_nom_region: info.region?.nom,
        },
      }
    );
    modifiedCount += updateResult.modifiedCount;
    matchedCount += updateResult.matchedCount;
    loadingBar.increment();
  });
  loadingBar.stop();
  logger.info(`${matchedCount} dossiersApprenants matching valid UAIs`);
  logger.info(`${modifiedCount} dossiersApprenants updated`);
}, "retrieve-location-from-uai");
