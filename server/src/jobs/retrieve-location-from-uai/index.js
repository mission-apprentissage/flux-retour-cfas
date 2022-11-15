import cliProgress from "cli-progress";
import indexBy from "lodash.indexby";
import { runScript } from "../scriptWrapper.js";
import { asyncForEach } from "../../common/utils/asyncUtils.js";
import logger from "../../common/logger.js";
import { getDepartementCodeFromUai } from "../../common/domain/uai.js";
import { DEPARTEMENTS } from "../../common/constants/territoiresConstants.js";

const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const logger = require("../../common/logger");
const { getDepartementCodeFromUai } = require("../../common/domain/uai");
const { DEPARTEMENTS } = require("../../common/constants/territoiresConstants");
const { dossiersApprenantsDb } = require("../../common/model/collections");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script permet de créer un export contenant les CFAS sans SIRET
 */
runScript(async () => {
  const departementsMap = indexBy(DEPARTEMENTS, "uaiCode");
  const allUais = await dossiersApprenantsDb().distinct("uai_etablissement");

  logger.info(`${allUais.length} UAI found. Will update matching dossiersApprenants...`);
  loadingBar.start(allUais.length, 0);

  let modifiedCount = 0;
  let matchedCount = 0;

  await asyncForEach(allUais, async (uaiToUpdate) => {
    const infoCodeFromUai = getDepartementCodeFromUai(uaiToUpdate);
    const info = departementsMap[infoCodeFromUai];

    if (!info) return;

    const updateResult = await dossiersApprenantsDb().updateMany(
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
