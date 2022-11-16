import logger from "../../common/logger.js";
import path from "path";
import { runScript } from "../scriptWrapper.js";
import { asyncForEach } from "../../common/utils/asyncUtils.js";
import { readJsonFromCsvFile } from "../../common/utils/fileUtils.js";
import { getDirname } from "../../common/utils/esmUtils.js";

/**
 * @param  {string} reseauText
 * @returns {[string]} List of parsed réseaux
 */
const parseReseauxTextFromCsv = (reseauText) => {
  if (!reseauText || reseauText === "Hors réseau CFA EC") {
    return [];
  }
  const reseaux = reseauText.split("|").map((reseau) => reseau.toUpperCase());
  return reseaux;
};
/**
 * @param  {[any]} array1
 * @param  {[any]} array2
 * @returns  {boolean}
 */
const arraysContainSameValues = (array1, array2) => {
  if (!Array.isArray(array1) || !Array.isArray(array2) || array1.length !== array2.length) {
    return false;
  }

  array1.forEach((item) => {
    if (!array2.includes(item)) return false;
  });
  return true;
};

const FILE_PATH = path.join(getDirname(import.meta.url), "referentiel-reseau-excellence-pro.csv");

runScript(async ({ cfas }) => {
  // read référentiel file from Excellence Pro and convert it to JSON
  const excellenceProReferentielJson = readJsonFromCsvFile(FILE_PATH, ",");

  // init counters for final log
  let foundCount = 0;
  let foundUniqueCount = 0;
  let organismeUpdatedCount = 0;
  let organismeUpdateErrorCount = 0;

  // iterate over every line (organisme de formation) in the référentiel file
  await asyncForEach(excellenceProReferentielJson, async (excellenceProReferentielJsonLine) => {
    const organismeReferentielExcellencePro = {
      siret: excellenceProReferentielJsonLine["Siret"],
      uai: excellenceProReferentielJsonLine["UAIvalidée"],
      reseaux: parseReseauxTextFromCsv(excellenceProReferentielJsonLine["Réseauàjour"]),
    };

    // try to retrieve organisme in our database with UAI and SIRET if UAI is provided
    const organismeInDb = organismeReferentielExcellencePro.uai
      ? await cfas.getFromUaiAndSiret(organismeReferentielExcellencePro.uai, organismeReferentielExcellencePro.siret)
      : await cfas.getFromSiret(organismeReferentielExcellencePro.siret);

    const found = organismeInDb.length !== 0;
    const foundUnique = found && organismeInDb.length === 1;

    if (found) foundCount++;

    // if only one result, we compare reseaux between organisme in Excellence Pro référentiel and the one we found in our database
    // and update our organisme with the updated list of reseaux
    if (foundUnique) {
      foundUniqueCount++;
      const uniqueOrganismeFromDb = organismeInDb[0];

      const reseauxFromDb = uniqueOrganismeFromDb.reseaux || [];
      const reseauxFromReferentiel = organismeReferentielExcellencePro.reseaux || [];

      if (!arraysContainSameValues(reseauxFromDb, reseauxFromReferentiel)) {
        logger.info(
          "Organisme with UAI",
          uniqueOrganismeFromDb.uai,
          "and SIRET",
          organismeReferentielExcellencePro.siret,
          "will be updated with list of reseaux",
          reseauxFromReferentiel.join(", ")
        );
        try {
          await cfas.updateCfaReseauxFromUai(uniqueOrganismeFromDb.uai, reseauxFromReferentiel);
          organismeUpdatedCount++;
        } catch (err) {
          organismeUpdateErrorCount++;
          logger.error(err);
        }
      }
    }
  });
  logger.info(
    "Organismes du référentiel Excellence Pro trouvés en base",
    foundCount,
    "/",
    excellenceProReferentielJson.length
  );
  logger.info(
    "Organismes du référentiel Excellence Pro trouvés uniques en base",
    foundUniqueCount,
    "/",
    excellenceProReferentielJson.length
  );
  logger.info("Organismes en base dont les réseaux ont été mis à jour :", organismeUpdatedCount);
  logger.info("Organismes en base n'ont pas pu être mis à jour :", organismeUpdateErrorCount);
}, "temp-maj-organismes-reseau-excellence-pro");
