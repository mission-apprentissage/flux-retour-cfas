const logger = require("../../../common/logger");
const { toCsv } = require("../../../common/utils/exporterUtils");
const { readJsonFromCsvFile } = require("../../../common/utils/fileUtils");

const FILE_TO_VALIDATE = "/data/gesti_uai.csv";
const FILE_REFERENCE = "/data/ListeCFA_sifa_avecsiret.csv";

/* Vérifie que UAI respecte le format alphanumérique 8 caractères et existe dans la base de référence */

const validateUais = async () => {
  logger.info("Start validation for UAI");
  let uaiLinesToValidate, uaiLinesSifa;

  // file to validate
  try {
    uaiLinesToValidate = readJsonFromCsvFile(__dirname + FILE_TO_VALIDATE);
  } catch (err) {
    logger.error(`Problem while reading ${FILE_TO_VALIDATE} input file`, err);
    return;
  }

  // file used as reference for UAI
  try {
    uaiLinesSifa = readJsonFromCsvFile(__dirname + FILE_REFERENCE);
  } catch (err) {
    logger.error(`Problem while reading ${FILE_REFERENCE} reference file`, err);
    return;
  }

  const validated = [];

  // iterate over uais and validate them
  uaiLinesToValidate.forEach((gestiLine) => {
    const uai = gestiLine.uai_code_educnationale || gestiLine["RNEiMFR"];

    // format is supposed to be 7 digits and 1 letter
    const isFormatValid = Boolean(uai) && /^[0-9_]{7}[a-zA-Z]{1}$/.test(uai);
    // uai should exist in reference database
    const existsInSifa = Boolean(
      uaiLinesSifa.find((sifaLine) => {
        return sifaLine.numero_uai === uai;
      })
    );

    // add three columns to check invalid data
    validated.push({
      ...gestiLine,
      ["Format valide"]: isFormatValid,
      ["Existant dans SIFA"]: existsInSifa,
    });
  });

  await toCsv(validated, __dirname + "/data", `result_uai_${Date.now()}.csv`, { quote: "", delimiter: ";" });
  logger.info("End validation for UAI");
};

module.exports = validateUais;
