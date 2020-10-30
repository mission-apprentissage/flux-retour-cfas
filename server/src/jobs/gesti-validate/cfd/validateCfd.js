const axios = require("axios");
const logger = require("../../../common/logger");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { toCsv } = require("../../../common/utils/exporterUtils");
const { readJsonFromCsvFile } = require("../../../common/utils/fileUtils");

const FILE_TO_VALIDATE = "/data/BDD_diplome_cleaned.csv";
const FILE_REFERENCE = "/data/base_formation_diplome.csv";
const MS_DELAY_BETWEEN_API_CALLS = 100;

const sleep = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, MS_DELAY_BETWEEN_API_CALLS);
  });
};

/* Vérifie que CFD respecte le format alphanumérique 8 caractères, existe dans la base de référence et dans celle de MNA */

const validateCfds = async () => {
  logger.info("Start validation for CFD");
  let cfdLinesToValidate, cfdLinesReference;

  // file to validate
  try {
    cfdLinesToValidate = readJsonFromCsvFile(__dirname + FILE_TO_VALIDATE);
  } catch (err) {
    logger.error(`Problem while reading ${FILE_TO_VALIDATE} input file`, err);
    return;
  }

  // file used as reference for CFD
  try {
    cfdLinesReference = readJsonFromCsvFile(__dirname + FILE_REFERENCE);
  } catch (err) {
    logger.error(`Problem while reading ${FILE_REFERENCE} reference file`, err);
    return;
  }

  const validated = [];

  // iterate over cfds and validate them
  await asyncForEach(cfdLinesToValidate, async (gestiLine) => {
    const cfd = gestiLine.formation_diplome;

    // format is supposed to be 8 alphanumerical characters
    const isFormatValid = cfd && Boolean(cfd.match(/^[a-zA-Z0-9_]{8}$/));
    // cfd should exist in reference database
    const existsInReference = Boolean(
      cfdLinesReference.find((referenceLine) => {
        return referenceLine.FORMATION_DIPLOME === cfd;
      })
    );

    // cfd should exist in our database
    let existsInMNA = false;

    if (isFormatValid) {
      try {
        const { data } = await axios.post("https://tables-correspondances.apprentissage.beta.gouv.fr/api/cfd", {
          cfd,
        });
        existsInMNA = Boolean(data.result.cfd);
      } catch (err) {
        logger.error("Error while calling tables-correspondance API");
        existsInMNA = "ERREUR LORS DE LA VERIF";
      }
    }

    // add three columns to check invalid data
    validated.push({
      ...gestiLine,
      ["Format valide"]: isFormatValid,
      ["Existant dans BCN"]: existsInReference,
      ["Existant dans MNA"]: existsInMNA,
    });

    // IMPORTANT so we don't take the production API down
    await sleep();
  });

  await toCsv(validated, __dirname + "/data", `result_cfd_${Date.now()}.csv`, { quote: "", delimiter: ";" });

  logger.info("End validation for CFD");
};

module.exports = validateCfds;
