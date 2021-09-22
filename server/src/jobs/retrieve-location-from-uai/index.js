const cliProgress = require("cli-progress");
const axios = require("axios");
const indexBy = require("lodash.indexby");

const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const logger = require("../../common/logger");

const GEO_API_HOST = "https://geo.api.gouv.fr";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

const normalizeCodeTerritoire = (code) => {
  if (Number(code) < 10) return `0${Number(code)}`;
  return Number(code).toString();
};

/**
 * Ce script permet de créer un export contenant les CFAS sans SIRET
 */
runScript(async ({ db }) => {
  const { data } = await axios.get(`${GEO_API_HOST}/departements?fields=nom,code,codeRegion,codePostal,region`);
  const departementsMap = indexBy(data, "code");
  const regionsTab = [];
  for (let index = 0; index < data.length; index++) {
    const element = data[index];
    regionsTab.push({
      nom: element.nom,
      code: element.code,
    });
  }
  const regionsMap = indexBy(regionsTab, "code");

  const allValidUais = await db.collection("statutsCandidats").distinct("uai_etablissement", {
    uai_etablissement_valid: true,
  });
  logger.info(`${allValidUais.length} valid UAI found. Will update matching statuts candidats...`);
  loadingBar.start(allValidUais.length, 0);

  let modifiedCount = 0;
  let matchedCount = 0;
  await asyncForEach(allValidUais, async (uaiToUpdate) => {
    const departementCodeFromUai = normalizeCodeTerritoire(uaiToUpdate.slice(0, 3));
    const regionsCodeFromUai = normalizeCodeTerritoire(uaiToUpdate.slice(0, 3));
    const departement = departementsMap[departementCodeFromUai];
    const region = regionsMap[regionsCodeFromUai];

    if (!departement) return;
    if (!region) return;

    const updateResult = await db.collection("statutsCandidats").updateMany(
      { uai_etablissement: uaiToUpdate },
      {
        $set: {
          etablissement_num_departement: departement.code,
          etablissement_nom_departement: departement.nom,
          etablissement_num_region: departement.codeRegion,
          etablissement_nom_region: region.nom,
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
