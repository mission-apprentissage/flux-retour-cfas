const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { StatutCandidat } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { getSiretInfo } = require("../../common/apis/apiTablesCorrespondances");
const { jobNames } = require("../../common/model/constants");

// Map containing etablissementsData - for limiting API Calls
const etablissementsInfosCache = new Map();

/**
 * Ce script permet de récupérer les données de localisation d'établissements
 * pour chaque statutCandidat ayant un SIRET
 */
runScript(async () => {
  logger.info("Run Location Retrieving Job");

  // Parse all statutsCandidat with siret_etablissement
  const statutsWithSiret = await StatutCandidat.find({ siret_etablissement_valid: true });

  await asyncForEach(statutsWithSiret, async (statutCandidat) => {
    logger.info(`Searching location data for SIRET ${statutCandidat.siret_etablissement}`);

    // Get etablissementData from API Tables de correspondance or from cache if already fetched
    const etablissementDataFromSiret = await findEtablissementData(statutCandidat.siret_etablissement);

    if (etablissementDataFromSiret) {
      // Update in db
      await StatutCandidat.findByIdAndUpdate(
        statutCandidat._id,
        {
          etablissement_adresse: etablissementDataFromSiret.adresse,
          etablissement_code_postal: etablissementDataFromSiret.code_postal,
          etablissement_localite: etablissementDataFromSiret.localite,
          etablissement_geo_coordonnees: etablissementDataFromSiret.geo_coordonnees,
          etablissement_num_region: etablissementDataFromSiret.region_implantation_code,
          etablissement_nom_region: etablissementDataFromSiret.region_implantation_nom,
          etablissement_num_departement: etablissementDataFromSiret.num_departement,
          etablissement_nom_departement: etablissementDataFromSiret.nom_departement,
          etablissement_num_academie: etablissementDataFromSiret.num_academie,
          etablissement_nom_academie: etablissementDataFromSiret.nom_academie,
        },
        { new: true }
      );
      logger.info(`Location data updated in db for siret ${statutCandidat.siret_etablissement}`);
    } else {
      logger.info(`No data found in Tables de Co for siret ${statutCandidat.siret_etablissement}`);
    }
  });

  logger.info("End Location Retrieving Job");
}, jobNames.etablissementsRetrieveLocation);

/**
 * Search etablissement data from Siret
 * Use a local Map
 * @param {*} siret
 */
const findEtablissementData = async (siret) => {
  // Add to Map from API Tables de co if not present
  if (!etablissementsInfosCache.get(siret)) {
    const etablissementDataFromSiret = await getSiretInfo(siret);
    if (!etablissementDataFromSiret) return null;
    etablissementsInfosCache.set(siret, etablissementDataFromSiret);
  }

  return etablissementsInfosCache.get(siret);
};
