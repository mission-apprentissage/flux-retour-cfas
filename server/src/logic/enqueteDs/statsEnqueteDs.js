const config = require("config");
const dsFetcher = require("../../common/dsFetcher");
const createMnaCatalogApi = require("../../common/apis/mnaCatalogApi");
const { getEmailCampaign } = require("../../common/utils/sendinblueUtils");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { round } = require("lodash");
const { mapDsChamps } = require("./mapping/dsMapper");
const { erps, dsStates } = require("./mapping/constants");

module.exports = async () => {
  // Init DS Config
  dsFetcher.config({
    id: config.demarchesSimplifiees.procedureCfas2020Id,
    token: config.demarchesSimplifiees.apiToken,
  });

  const mnaApi = await createMnaCatalogApi();
  const sendinblueStats = await getSendinblueStats();

  // Recuperation des données de reference
  const referenceData = {
    dossiersData: await getAllDossiersData(),
    nbMailsEnvoyesInitialement: sendinblueStats[0].nbMailsEnvoyes,
    nbTotalDossiersDs: (await dsFetcher.getProcedure()).procedure.total_dossier,
    nbEtablissementsCatalogue: await mnaApi.getEtablissementsCount(),
  };

  // Construction d'un objet de stats
  return {
    stats: {
      global: await getGlobalStats(),
      suivi_envoi_sendinblue: sendinblueStats,
      adresses: await getAdressesStats(),
      reponses_par_erp: await getReponsesParErp(referenceData),
      reponses_par_regions_academies: await getReponsesRegionsAcademies(),
      reponses_par_nb_formations: await getReponsesParNbFormations(),
    },
  };
};

/**
 * Récupération des stats générales
 */
const getGlobalStats = async () => {};

/**
 * Récupération des stats SIB
 * Pour chaque campagne identifiée construction d'un objet de stats
 */
const getSendinblueStats = async () => {
  const statsSib = [];
  const idDsCampaigns = config.sendinblue.idsCampaignDs2020.split(";");

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

/**
 * Récupération des stats des adresses
 * Liens avec l'API Catalogue
 */
const getAdressesStats = async () => {};

/**
 * Récupération des stats des réponses par ERP
 * @param {*} referenceData
 */
const getReponsesParErp = async ({
  dossiersData,
  nbMailsEnvoyesInitialement,
  nbTotalDossiersDs,
  nbEtablissementsCatalogue,
}) => {
  const statsErp = [];
  await asyncForEach(erps, async (currentErp) => {
    const dossierForErp = dossiersData.filter((item) => item.questions.erpNom === currentErp.value);
    statsErp.push({
      erp: currentErp.name,
      nombreDossiersDansDs: dossierForErp.length,
      tauxRepondantsOk: {
        tauxRepondantsOk_demarcheInitiee: getPercentageFromTotal(
          dossierForErp.filter((item) => item.state === dsStates.initiee).length,
          nbMailsEnvoyesInitialement
        ),
        tauxRepondantsOk_demarcheRecue: getPercentageFromTotal(
          dossierForErp.filter((item) => item.state === dsStates.recue).length,
          nbMailsEnvoyesInitialement
        ),
      },
      tauxErpMailsEnvoyes: getPercentageFromTotal(dossierForErp.length, nbMailsEnvoyesInitialement),
      pourcentageErpReponsesDs: getPercentageFromTotal(dossierForErp.length, nbTotalDossiersDs),
      pourcentageErpNbEtablissementsCatalogue: getPercentageFromTotal(dossierForErp.length, nbEtablissementsCatalogue),
    });
  });
  return statsErp;
};

const getReponsesRegionsAcademies = async () => {};

const getReponsesParNbFormations = async () => {};

/**
 * Récupération de toutes les données des dossiers DS
 * Construction de la liste des réponses aux questions
 * @param {*} sample
 */
const getAllDossiersData = async (sample = null) => {
  const dossiersData = [];
  let allDossiers = sample ? (await dsFetcher.getDossiers()).splice(0, sample) : await dsFetcher.getDossiers();

  await asyncForEach(allDossiers, async ({ id }) => {
    const currentDossier = await dsFetcher.getDossier(id);
    if (currentDossier) {
      if (currentDossier.dossier) {
        const questions = await mapDsChamps(currentDossier.dossier);
        const dossierWithQuestions = { ...currentDossier.dossier, ...questions };
        dossiersData.push(dossierWithQuestions);
      }
    }
  });

  return dossiersData;
};

/**
 * Calcul du pourcentage sur 2 décimales
 * @param {*} dossiersLength
 * @param {*} totalDossiersLength
 */
const getPercentageFromTotal = (dossiersLength, totalDossiersLength) =>
  round((dossiersLength / totalDossiersLength) * 100, 2);
