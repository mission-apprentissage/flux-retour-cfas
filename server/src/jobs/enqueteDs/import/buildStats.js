const config = require("config");
const { uniqBy, uniqWith } = require("lodash");
const logger = require("../../../common/logger");
const dsFetcher = require("../../../common/dsFetcher");
const createMnaCatalogApi = require("../../../common/apis/mnaCatalogApi");
const { getEmailCampaign } = require("../../../common/utils/sendinblueUtils");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { erps, dsStates } = require("../utils/constants");
const { getRateResponseDsForNotInDemarcheStatuses, getPercentageFromTotal } = require("../utils/calculUtils");
const { DsDossier, DsStats } = require("../../../common/model");

let mnaApi = null;

/**
 * Module de construction des stats DS
 */
module.exports = async () => {
  // Init Mna Api + DS Config
  logger.info("Init Ds Config ...");
  dsFetcher.config({
    id: config.demarchesSimplifiees.procedureCfas2020Id,
    token: config.demarchesSimplifiees.apiToken,
  });
  mnaApi = await createMnaCatalogApi();

  // Construction d'un objet de stats
  logger.info("Building stats...");

  //  Recuperation des données de reference
  logger.info("Building reference data ...");
  const referenceData = {
    dossiersData: (await DsDossier.find({}).select("dossier")).map((item) => item._doc.dossier),
    nbSiretsNotfoundInCatalog: await DsDossier.distinct("dossier.entreprise.siren").countDocuments({
      siret_present_catalogue: false,
    }),
    nbSirensNotfoundInCatalog: await DsDossier.distinct("dossier.entreprise.siret_siege_social").countDocuments({
      siren_present_catalogue: false,
    }),
    nbTotalDossiersDs: (await dsFetcher.getProcedure()).procedure.total_dossier,
    nbEtablissementsDansCatalogue: await mnaApi.getEtablissementsCount(),
    nbFormationsDansCatalogue: await mnaApi.getFormationsCount(),
  };

  // Build Stats object
  const dsStats = new DsStats({
    globalStats: await buildGlobalStats(referenceData),
    sendinblueStats: await buildSendinblueStats(),
    erpsStats: await buildErpsStats(referenceData),
    locationStats: await buildRegionsAcademiesStats(referenceData),
  });
  await dsStats.save();
};

/**
 * Récupération des stats générales
 */
const buildGlobalStats = ({
  dossiersData,
  nbSiretsNotfoundInCatalog,
  nbSirensNotfoundInCatalog,
  nbTotalDossiersDs,
  nbEtablissementsDansCatalogue,
  nbFormationsDansCatalogue,
}) => {
  const dossiersDataUniqSiret = uniqBy(dossiersData, (item) => item.etablissement.siret);

  // Global
  const nbReponsesDs = nbTotalDossiersDs;
  const nbReponsesSiretUniquesInDs = dossiersDataUniqSiret.length;
  const nbDossiersAvecFichierAttache = dossiersData.filter((item) => item.questions.coordonnesRespTechMultiSites)
    .length;
  const tauxDossiersAvecFichierAttache = getPercentageFromTotal(nbDossiersAvecFichierAttache, nbTotalDossiersDs);

  // Répondants OK
  const tauxReponseSiretUniquesTotalCatalogue = getPercentageFromTotal(
    nbReponsesSiretUniquesInDs,
    nbEtablissementsDansCatalogue
  );

  // Répondants OK - demarche recue
  const nbStatutDemarcheRecue = dossiersData.filter((item) => item.state === dsStates.recue).length;
  const tauxReponseDemarcheRecueTotalCatalogue = getPercentageFromTotal(
    nbStatutDemarcheRecue,
    nbEtablissementsDansCatalogue
  );
  const nbStatutSiretUniquesDemarcheRecue = dossiersDataUniqSiret.filter((item) => item.state === dsStates.recue)
    .length;
  const tauxReponseSiretUniquesDemarcheRecueTotalCatalogue = getPercentageFromTotal(
    nbStatutSiretUniquesDemarcheRecue,
    nbEtablissementsDansCatalogue
  );

  // Répondants OK - demarche initiee
  const nbStatutDemarcheInitiee = dossiersData.filter((item) => item.state === dsStates.initiee).length;
  const tauxReponseDemarcheInitieeTotalCatalogue = getPercentageFromTotal(
    nbStatutDemarcheInitiee,
    nbEtablissementsDansCatalogue
  );
  const nbStatutSiretUniquesDemarcheInitiee = dossiersDataUniqSiret.filter((item) => item.state === dsStates.initiee)
    .length;
  const tauxReponseSiretUniquesDemarcheInitieeTotalCatalogue = getPercentageFromTotal(
    nbStatutSiretUniquesDemarcheInitiee,
    nbEtablissementsDansCatalogue
  );

  // Répondants KO
  const nbNonRépondants = nbEtablissementsDansCatalogue - nbReponsesSiretUniquesInDs;
  const tauxNonRepondantsTotalCatalogue = getPercentageFromTotal(nbNonRépondants, nbEtablissementsDansCatalogue);
  const tauxRepondantsDemarcheNiRecueNiInitieeTotalCatalogue = getRateResponseDsForNotInDemarcheStatuses(
    [dsStates.initiee, dsStates.recue],
    dossiersDataUniqSiret,
    nbEtablissementsDansCatalogue
  );

  return {
    nbEtablissementsDansCatalogue,
    nbFormationsDansCatalogue,
    nbReponsesDs,
    nbReponsesSiretUniquesInDs,
    nbNonRépondants,
    nbDossiersAvecFichierAttache,
    tauxDossiersAvecFichierAttache,
    nbSiretDsNotInCatalogue: nbSiretsNotfoundInCatalog,
    nbSirenDsNotInCatalogue: nbSirensNotfoundInCatalog,

    RepondantsOk: {
      tauxReponseSiretUniquesTotalCatalogue,

      RepondantsOkDemarcheRecue: {
        nbStatutDemarcheRecue,
        tauxReponseDemarcheRecueTotalCatalogue,
        nbStatutSiretUniquesDemarcheRecue,
        tauxReponseSiretUniquesDemarcheRecueTotalCatalogue,
      },

      RepondantsOkDemarcheInitiee: {
        nbStatutDemarcheInitiee,
        tauxReponseDemarcheInitieeTotalCatalogue,
        nbStatutSiretUniquesDemarcheInitiee,
        tauxReponseSiretUniquesDemarcheInitieeTotalCatalogue,
      },
    },
    RepondantsKo: {
      nbNonRépondants,
      tauxNonRepondantsTotalCatalogue,
      tauxRepondantsDemarcheNiRecueNiInitieeTotalCatalogue,
    },
  };
};

/**
 * Récupération des stats SIB
 * Pour chaque campagne identifiée construction d'un objet de stats
 */
const buildSendinblueStats = async () => {
  const statsSib = [];
  const idDsCampaigns = config.sendinblue.idsCampaignDs2020.split(";");

  await asyncForEach(idDsCampaigns, async (currentIdCampaign) => {
    const currentCampaign = await getEmailCampaign(currentIdCampaign);
    if (currentCampaign) {
      if (currentCampaign.statistics) {
        if (currentCampaign.statistics.globalStats) {
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
      }
    }
  });
  return statsSib;
};

/**
 * Récupération des stats des réponses par ERP
 * @param {*} referenceData
 */
const buildErpsStats = async ({ dossiersData, nbTotalDossiersDs, nbEtablissementsDansCatalogue }) => {
  const statsErp = [];
  await asyncForEach(erps, async (currentErp) => {
    const dossiersForErp = dossiersData.filter((item) => item.questions.erpNom === currentErp.value);
    let statsCommonForErp = await getCommonResponsesRates(
      dossiersForErp,
      nbTotalDossiersDs,
      nbEtablissementsDansCatalogue
    );
    if (currentErp.totalCfasKnown) {
      const tauxNbDossiersDsTotalCfasConnusErp = getPercentageFromTotal(
        statsCommonForErp.RepondantsOk.nbReponsesDsSiretUnique,
        currentErp.totalCfasKnown
      );
      statsCommonForErp = {
        ...statsCommonForErp,
        ...{
          tauxNbDossiersDsTotalCfasConnusErp: tauxNbDossiersDsTotalCfasConnusErp,
        },
      };
    }

    const statErp = { ...{ erp: currentErp.name }, ...statsCommonForErp };
    statsErp.push(statErp);
  });
  return statsErp;
};

/**
 * Construction de stats génériques
 * @param {*} dossiersData
 * @param {*} nbTotalDossiersDs
 * @param {*} nbEtablissementsDansCatalogue
 */
const getCommonResponsesRates = async (dossiersData, nbTotalDossiersDs, nbEtablissementsDansCatalogue) => {
  const dossiersSiretUnique = uniqBy(dossiersData, (item) => item.etablissement.siret);
  const nbDossiersSiretUnique = dossiersSiretUnique.length;

  // Répondants Ok
  const nbStatutsDansDs = dossiersData.length;
  const tauxReponseTotalCatalogue = getPercentageFromTotal(nbStatutsDansDs, nbEtablissementsDansCatalogue);
  const tauxReponseTotalDossiersDs = getPercentageFromTotal(nbStatutsDansDs, nbTotalDossiersDs);

  const volumetriesEstimees = dossiersData
    .filter((item) => item.catalogInfos)
    .filter((item) => item.catalogInfos.tauxVolumetrieFormationsCatalogue)
    .map((item) => item.catalogInfos.tauxVolumetrieFormationsCatalogue);

  const sommeVolumetrieEstimeeReponsesFormationsCatalogue =
    volumetriesEstimees.length > 0 ? volumetriesEstimees.reduce((sum, x) => sum + x) : -1;

  // Répondants OK - demarche recue
  const nbStatutDemarcheRecue = dossiersData.filter((item) => item.state === dsStates.recue).length;
  const tauxReponseDemarcheRecueTotalCatalogue = getPercentageFromTotal(
    nbStatutDemarcheRecue,
    nbEtablissementsDansCatalogue
  );
  const nbStatutSiretUniquesDemarcheRecue = dossiersSiretUnique.filter((item) => item.state === dsStates.recue).length;
  const tauxReponseSiretUniquesDemarcheRecueTotalCatalogue = getPercentageFromTotal(
    nbStatutSiretUniquesDemarcheRecue,
    nbEtablissementsDansCatalogue
  );

  // Répondants OK - demarche initiee
  const nbStatutDemarcheInitiee = dossiersData.filter((item) => item.state === dsStates.initiee).length;
  const tauxReponseDemarcheInitieeTotalCatalogue = getPercentageFromTotal(
    nbStatutDemarcheInitiee,
    nbEtablissementsDansCatalogue
  );
  const nbStatutSiretUniquesDemarcheInitiee = dossiersSiretUnique.filter((item) => item.state === dsStates.initiee)
    .length;
  const tauxReponseSiretUniquesDemarcheInitieeTotalCatalogue = getPercentageFromTotal(
    nbStatutSiretUniquesDemarcheInitiee,
    nbEtablissementsDansCatalogue
  );

  // Répondants KO
  const tauxRepondantsDemarcheNiRecueNiInitieeTotalCatalogue = getRateResponseDsForNotInDemarcheStatuses(
    [dsStates.initiee, dsStates.recue],
    dossiersSiretUnique,
    nbEtablissementsDansCatalogue
  );

  return {
    nbStatuts: nbStatutsDansDs,
    tauxReponseTotalCatalogue,
    tauxReponseTotalDossiersDs,
    sommeVolumetrieEstimeeReponsesFormationsCatalogue,
    RepondantsOk: {
      nbReponsesDsSiretUnique: nbDossiersSiretUnique,
      tauxReponseSiretUniquesTotalCatalogue: getPercentageFromTotal(
        nbDossiersSiretUnique,
        nbEtablissementsDansCatalogue
      ),

      RepondantsOkDemarcheRecue: {
        nbStatutDemarcheRecue,
        tauxReponseDemarcheRecueTotalCatalogue,
        nbStatutSiretUniquesDemarcheRecue,
        tauxReponseSiretUniquesDemarcheRecueTotalCatalogue,
      },

      RepondantsOkDemarcheInitiee: {
        nbStatutDemarcheInitiee,
        tauxReponseDemarcheInitieeTotalCatalogue,
        nbStatutSiretUniquesDemarcheInitiee,
        tauxReponseSiretUniquesDemarcheInitieeTotalCatalogue,
      },
    },
    RepondantsKo: {
      tauxRepondantsDemarcheNiRecueNiInitieeTotalCatalogue,
    },
  };
};

/**
 * Construction des stats par région / academies
 * @param {*} param0
 */
const buildRegionsAcademiesStats = async ({ dossiersData, nbTotalDossiersDs, nbEtablissementsDansCatalogue }) => {
  const statsRegionsAcademies = [];

  const allRegionsAcademies = dossiersData
    .filter((item) => item.catalogInfos)
    .filter((item) => item.catalogInfos.region_implantation_nom !== null)
    .filter((item) => item.catalogInfos.nom_academie !== null)
    .map((item) => ({
      region: item.catalogInfos.region_implantation_nom,
      academie: item.catalogInfos.nom_academie,
    }));

  const distinctRegionsAcademies = uniqWith(
    allRegionsAcademies,
    (item, item2) => item.region === item2.region && item.academie === item2.academie
  );

  await asyncForEach(distinctRegionsAcademies, async (currentRegionAcademie) => {
    const dossiersForRegionAndAcademie = dossiersData
      .filter((item) => item.catalogInfos)
      .filter((item) => item.catalogInfos.region_implantation_nom !== null)
      .filter((item) => item.catalogInfos.nom_academie !== null)
      .filter((item) => item.catalogInfos.region_implantation_nom === currentRegionAcademie.region)
      .filter((item) => item.catalogInfos.nom_academie === currentRegionAcademie.academie);

    let statsCommonForRegionAndAcademie = await getCommonResponsesRates(
      dossiersForRegionAndAcademie,
      nbTotalDossiersDs,
      nbEtablissementsDansCatalogue
    );
    const statRegionAcademie = {
      ...{ region: currentRegionAcademie.region, academie: currentRegionAcademie.academie },
      ...statsCommonForRegionAndAcademie,
    };
    statsRegionsAcademies.push(statRegionAcademie);
  });
  return statsRegionsAcademies;
};
