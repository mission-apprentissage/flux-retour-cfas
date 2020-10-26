const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const dsFetcher = require("../../common/dsFetcher");
const mapDsChamps = require("./mapping/dsMapper").mapDsChamps;
const { getEmailCampaign } = require("../../common/utils/sendinblueUtils");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const config = require("config");

runScript(async () => {
  logger.info("Stats from DS 2020");

  // Init DS Config
  dsFetcher.config({
    id: config.demarchesSimplifiees.procedureCfas2020Id,
    token: config.demarchesSimplifiees.apiToken,
  });

  // Get Stats from Sendinblue Campaigns
  const statsSib = await getSendinblueCampaignsStats();
  logger.info(statsSib);

  // Get all dossiers from DS
  const allDossiersWithQuestions = await getAllDossiersDetail();
  logger.info(allDossiersWithQuestions);

  logger.info("End stats from DS 2020");
});

const getAllDossiersDetail = async () => {
  const allDossiers = [];
  await asyncForEach(await dsFetcher.getDossiers(), async ({ id }) => {
    const currentDossier = await dsFetcher.getDossier(id);
    if (currentDossier) {
      if (currentDossier.dossier) {
        const questions = await mapDsChamps(currentDossier.dossier);
        const dossierWithQuestions = { ...currentDossier.dossier, ...questions };
        allDossiers.push(dossierWithQuestions);
      }
    }
  });
  return allDossiers;
};

const getSendinblueCampaignsStats = async () => {
  const idDsCampaigns = config.sendinblue.idsCampaignDs2020.split(";");

  const statsSib = [];
  await asyncForEach(idDsCampaigns, async (currentIdCampaign) => {
    const currentCampaign = await getEmailCampaign(currentIdCampaign);
    if (currentCampaign) {
      const statistics = currentCampaign.statistics.globalStats;
      const generalStats = {
        campagne_id: currentCampaign.id,
        campagne_nom: currentCampaign.name,
        nbMailsEnvoyes: statistics.sent,
        nbMailsOuverts: statistics.uniqueViews,
        nbMailsCliquesVersDs: statistics.uniqueClicks,
        nbAdressesErronnees: statistics.softBounces + statistics.hardBounces,
      };
      statsSib.push(generalStats);
    }
  });
  return statsSib;
};
