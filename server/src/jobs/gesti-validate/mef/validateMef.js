const axios = require("axios");
const logger = require("../../../common/logger");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { toCsv } = require("../../../common/utils/exporterUtils");
const { readJsonFromCsvFile } = require("../../../common/utils/fileUtils");

const FILE_TO_VALIDATE = "/data/BDD_MEF_cleaned.csv";
const FILE_REFERENCE = "/data/n_mef_.csv";
const MS_DELAY_BETWEEN_API_CALLS = 300;

const sleep = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, MS_DELAY_BETWEEN_API_CALLS);
  });
};

/* Vérifie que les MEF respectent le format, ont un libellé correspondant et/ou numéro MEF dans la base de référence BCN et dans celle de MNA */

const valideMefs = async () => {
  logger.info("Run verification for MEF");
  let mefLinesToValidate, mefLinesBcn;
  let validFormatCounter = 0;
  let libelleMatchingCounter = 0;
  let mefMatchingCounter = 0;
  let foundMatchCounter = 0;
  let mnaApiErrorCounter = 0;

  // file to validate
  try {
    mefLinesToValidate = readJsonFromCsvFile(__dirname + FILE_TO_VALIDATE);
  } catch (err) {
    logger.error(`Problem while reading ${FILE_TO_VALIDATE} input file`, err);
    return;
  }

  // file used as reference for MEF
  try {
    mefLinesBcn = readJsonFromCsvFile(__dirname + FILE_REFERENCE);
  } catch (err) {
    logger.error(`Problem while reading ${FILE_REFERENCE} reference file`, err);
    return;
  }

  const validated = [];

  // iterate over mefs and validate them
  await asyncForEach(mefLinesToValidate, async (gestiLine) => {
    // format is supposed to be 7-11 alphanumerical characters
    const isFormatValid = gestiLine.mef && Boolean(gestiLine.mef.match(/^[a-zA-Z0-9_]{7,11}$/));

    // Gesti MEF that are 11 chars long appear to have an extra "0" character at the end
    const mefToCheck =
      gestiLine.mef.length === 11 && gestiLine.mef.charAt(10) === "0" ? gestiLine.mef.slice(0, 10) : gestiLine.mef;

    // mef should exist in BCN database
    const foundInBCN = mefLinesBcn.find((bcnLine) => {
      return bcnLine.MEF === mefToCheck || bcnLine.LIBELLE_LONG === gestiLine.mef_libelle;
    });

    const libelleExistsInBcn = Boolean(foundInBCN) && foundInBCN.LIBELLE_LONG === gestiLine.mef_libelle;
    const mefExistsInBcn = Boolean(foundInBCN) && foundInBCN.MEF === mefToCheck;

    // API only accepts 10 characters long MEF
    let existsInMNA = false;
    if (mefToCheck.length === 10) {
      await sleep();
      try {
        const { data } = await axios.post("https://tables-correspondances.apprentissage.beta.gouv.fr/api/mef", {
          mef: mefToCheck,
        });
        existsInMNA = Boolean(data.result.mef10);
      } catch (err) {
        logger.error("Error while calling tables-correspondance API");
        existsInMNA = "ERREUR LORS DE LA VERIF";
        mnaApiErrorCounter++;
      }
    }

    if (isFormatValid) validFormatCounter++;
    if (libelleExistsInBcn) libelleMatchingCounter++;
    if (mefExistsInBcn) mefMatchingCounter++;
    if (foundInBCN) foundMatchCounter++;

    // add three columns to check invalid data
    validated.push({
      ...gestiLine,
      ["Format_valide"]: isFormatValid,
      ["Libelle existant dans BCN"]: libelleExistsInBcn,
      ["MEF existant dans BCN"]: mefExistsInBcn,
      ["Existant dans MNA"]: existsInMNA,
    });
  });

  logger.info(`[MEF] Formats valides dans csv Gesti: ${validFormatCounter} sur ${validated.length}`);
  logger.info(`[MEF] Libellés matchés dans BCN: ${libelleMatchingCounter} sur ${validated.length}`);
  logger.info(`[MEF] MEF matchés dans BCN: ${mefMatchingCounter} sur ${validated.length}`);
  logger.warn(`[MEF] Lignes sans matching dans BCN: ${validated.length - foundMatchCounter} sur ${validated.length}`);
  logger.warn(`[MEF] Erreurs lors de la vérification dans base MNA: ${mnaApiErrorCounter}`);

  // create csv file with results
  await toCsv(validated, __dirname + "/data", `result_mef_${Date.now()}.csv`, { quote: "", delimiter: ";" });

  logger.info("End validation for MEF");
};

module.exports = valideMefs;
