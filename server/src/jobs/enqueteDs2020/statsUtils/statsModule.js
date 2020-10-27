const config = require("config");
const dsFetcher = require("../../../common/dsFetcher");
const { getRateResponseDsForNotInDemarcheStatuses, getPercentageFromTotal } = require("./calculUtils");
const createMnaCatalogApi = require("../../../common/apis/mnaCatalogApi");
const { getEmailCampaign } = require("../../../common/utils/sendinblueUtils");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { mapDsChamps } = require("./dsMapper");
const { erps, dsStates } = require("./constants");
const fs = require("fs-extra");
const path = require("path");
const { uniqBy, uniqWith } = require("lodash");

// Data path for local mode
const localDossierDataFile = path.join(__dirname, "./../output/dossiersData.json");
const localMissingSiretFile = path.join(__dirname, "./../output/missingSiretInCatalog.json");
const localMissingSirenFile = path.join(__dirname, "./../output/missingSirenInCatalog.json");

let mnaApi = null;

module.exports = async (localMode) => {
  // Init DS Config
  dsFetcher.config({
    id: config.demarchesSimplifiees.procedureCfas2020Id,
    token: config.demarchesSimplifiees.apiToken,
  });

  // Load Mna Api
  mnaApi = await createMnaCatalogApi();

  // Recuperation des données de reference
  const referenceData = await loadReferenceDataFromApis(localMode);

  // Construction d'un objet de stats
  return {
    globalStats: buildGlobalStats(referenceData),
    sendinblueStats: await buildSendinblueStats(),
    reponses_par_erp: await buildErpsStats(referenceData),
    reponses_par_regions_academies: await buildRegionsAcademiesStats(referenceData),
    adresses: await buildAdressesStats(),
  };
};

/**
 * Récupération des stats générales
 */
const buildGlobalStats = ({
  dossiersData,
  siretNotfoundInCatalog,
  sirenNotfoundInCatalog,
  nbTotalDossiersDs,
  nbEtablissementsDansCatalogue,
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
    nbReponsesDs,
    nbReponsesSiretUniquesInDs,
    nbDossiersAvecFichierAttache,
    tauxDossiersAvecFichierAttache,
    nbSiretDsNotInCatalogue: siretNotfoundInCatalog.length,
    nbSirenDsNotInCatalogue: sirenNotfoundInCatalog.length,

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
 * Récupération des stats des adresses
 * Liens avec l'API Catalogue
 */
const buildAdressesStats = async () => {};

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

/**
 * Récupération de toutes les données des dossiers DS
 * Construction de la liste des réponses aux questions
 * @param {*} sample
 */
const getAllDossiersData = async (sample = null) => {
  const dossiersData = [];
  const siretNotfoundInCatalog = [];
  const sirenNotfoundInCatalog = [];

  const allDossiers = sample ? (await dsFetcher.getDossiers()).splice(0, sample) : await dsFetcher.getDossiers();

  const totalNbFormationsInCatalog = await mnaApi.getFormationsCount();

  await asyncForEach(allDossiers, async ({ id }) => {
    const currentDossier = await dsFetcher.getDossier(id);
    if (currentDossier) {
      if (currentDossier.dossier) {
        // Add questions mapped
        const questions = await mapDsChamps(currentDossier.dossier);
        let fullDossier = { ...currentDossier.dossier, ...questions };

        // Get data from Mna Api Catalog
        let etablissementsInCatalog = await mnaApi.getEtablissementBySiret(currentDossier.dossier.etablissement.siret);

        // Find by siret not available
        if (etablissementsInCatalog.etablissements.length === 0) {
          siretNotfoundInCatalog.push(currentDossier.dossier.etablissement.siret);
          etablissementsInCatalog = await mnaApi.getEtablissementBySiren(currentDossier.dossier.entreprise.siren);

          // Find by siren not available
          if (etablissementsInCatalog.etablissements.length === 0) {
            sirenNotfoundInCatalog.push(currentDossier.dossier.entreprise.siren);
          }
        } else {
          const etablissementInCatalog = etablissementsInCatalog.etablissements[0];

          if (etablissementInCatalog) {
            const nbFormationsForEtablissement = etablissementInCatalog.formations_ids
              ? etablissementInCatalog.formations_ids.length
              : 0;
            fullDossier = {
              ...fullDossier,
              ...{
                catalogInfos: {
                  nbFormations: nbFormationsForEtablissement,
                  tauxVolumetrieFormationsCatalogue: getPercentageFromTotal(
                    nbFormationsForEtablissement,
                    totalNbFormationsInCatalog
                  ),
                  num_academie: etablissementInCatalog.num_academie,
                  nom_academie: etablissementInCatalog.nom_academie,
                  region_implantation_code: etablissementInCatalog.region_implantation_code,
                  region_implantation_nom: etablissementInCatalog.region_implantation_nom,
                },
              },
            };
          }
        }

        dossiersData.push(fullDossier);
      }
    }
  });

  return { dossiersData, siretNotfoundInCatalog, sirenNotfoundInCatalog };
};

/**
 * Load reference data from Apis DS & Mna Catalog
 */
const loadReferenceDataFromApis = async (localMode, sample = null) => {
  let dossiersData = [];
  let siretNotfoundInCatalog = [];
  let sirenNotfoundInCatalog = [];

  // Si local mode on cherche / ecrit les données dans un fichier json local
  if (localMode && fs.existsSync(localDossierDataFile)) {
    dossiersData = await fs.readJSON(localDossierDataFile);
    siretNotfoundInCatalog = await fs.readJSON(localMissingSiretFile);
    sirenNotfoundInCatalog = await fs.readJSON(localMissingSirenFile);
  } else {
    let { dossiersData, siretNotfoundInCatalog, sirenNotfoundInCatalog } = await getAllDossiersData(sample);

    fs.writeFile(localDossierDataFile, JSON.stringify(dossiersData), (err) => {
      if (err) console.error(err);
    });

    fs.writeFile(localMissingSiretFile, JSON.stringify(siretNotfoundInCatalog), (err) => {
      if (err) console.error(err);
    });

    fs.writeFile(localMissingSirenFile, JSON.stringify(sirenNotfoundInCatalog), (err) => {
      if (err) console.error(err);
    });
  }

  return {
    dossiersData,
    siretNotfoundInCatalog,
    sirenNotfoundInCatalog,
    nbTotalDossiersDs: (await dsFetcher.getProcedure()).procedure.total_dossier,
    nbEtablissementsDansCatalogue: await mnaApi.getEtablissementsCount(),
    nbFormationsDansCatalogue: await mnaApi.getFormationsCount(),
  };
};
