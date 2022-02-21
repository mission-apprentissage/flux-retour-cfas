const cliProgress = require("cli-progress");
const axios = require("axios");
const indexBy = require("lodash.indexby");

const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const logger = require("../../common/logger");
const { getDepartementCodeFromUai } = require("../../common/domain/uai");

const GEO_API_HOST = "https://geo.api.gouv.fr";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de créer un export contenant les CFAS sans SIRET
 */
runScript(async ({ db }) => {
  const { data } = await axios.get(`${GEO_API_HOST}/departements?fields=nom,code,codeRegion,codePostal,region`);
  const infoMap = indexBy(data, "code");
  const allUais = await db.collection("statutsCandidats").distinct("uai_etablissement");

  logger.info(`${allUais.length} UAI found. Will update matching statuts candidats...`);
  loadingBar.start(allUais.length, 0);

  let modifiedCount = 0;
  let matchedCount = 0;

  await asyncForEach(allUais, async (uaiToUpdate) => {
    const infoCodeFromUai = getDepartementCodeFromUai(uaiToUpdate);
    const info = infoMap[infoCodeFromUai];

    if (!info) return;

    const updateResult = await db.collection("statutsCandidats").updateMany(
      { uai_etablissement: uaiToUpdate },
      {
        $set: {
          etablissement_num_departement: info.code,
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
  logger.info(`${matchedCount} statuts candidats matching valid UAIs`);
  logger.info(`${modifiedCount} statuts candidats updated`);
}, "retrieve-location-from-uai");
