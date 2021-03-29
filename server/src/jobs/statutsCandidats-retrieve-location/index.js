const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { StatutCandidat } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { getSiretInfo } = require("../../common/apis/apiTablesCorrespondances");
const { jobNames } = require("../../common/model/constants");

/**
 * Ce script permet de récupérer les données de localisation d'établissements
 * pour chaque statutCandidat ayant un SIRET valide
 */
runScript(async () => {
  logger.info("Run Location Retrieving Job");

  // Find all valid SIRETs in db
  const allValidSirets = await StatutCandidat.distinct("siret_etablissement", { siret_etablissement_valid: true });
  logger.info(`${allValidSirets.length} valid SIRET found in DB`);

  let updatedStatutsCandidatsCount = 0;
  let foundLocationCount = 0;
  const unknownSiretInTco = [];

  await asyncForEach(allValidSirets, async (validSiret) => {
    // Get etablissementData from API Tables de correspondance
    const etablissementDataFromSiret = await getSiretInfo(validSiret);

    if (!etablissementDataFromSiret) {
      unknownSiretInTco.push(validSiret);
      return;
    }

    try {
      const updateResult = await StatutCandidat.updateMany(
        { siret_etablissement: validSiret },
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
        }
      );
      updatedStatutsCandidatsCount += updateResult.nModified;
      foundLocationCount++;
    } catch (err) {
      logger.error(`Error while updating etablissement information with SIRET ${validSiret}`);
      logger.error(err);
    }
  });

  logger.info(`Etablissement location information found for ${foundLocationCount} SIRET`);
  logger.info(`${updatedStatutsCandidatsCount} statuts candidats updated with etablissement location information`);
  logger.warn(`No data found in Tables de Co for ${unknownSiretInTco.length} SIRET ${unknownSiretInTco}`);
  logger.info("End Location Retrieving Job");
}, jobNames.statutsCandidatsRetrieveLocation);
