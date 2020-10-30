/* eslint-disable no-process-exit */
const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");
const { toCsv } = require("../../common/utils/exporterUtils");
const logger = require("../../common/logger");

/*
    The csv exports from Gesti contain double quotes " around every value. Instead of having:

    id;name;
    01;John Doe

    We have:

    "id";"name"
    "01";"John Doe"

    This script will create a copy of the csv file and append "_cleaned" to its name
*/

/* remove first and last characters for value, " in our case*/
const sanitizeGestiValue = (value) => {
  if (value && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
    return value.slice(1, value.length - 1);
  }
  return value;
};

const sanitizeGestiCsv = async (fileName) => {
  let jsonToSanitize;
  try {
    jsonToSanitize = readJsonFromCsvFile(__dirname + `/data/${fileName}`);
  } catch (err) {
    logger.error(`Problem while reading ${fileName}`, err);
    return;
  }

  const sanitized = jsonToSanitize.map((line) => {
    const sanitizedLine = Object.keys(line).reduce((acc, key) => {
      return { ...acc, [sanitizeGestiValue(key)]: sanitizeGestiValue(line[key]) };
    }, {});
    return sanitizedLine;
  });

  await toCsv(sanitized, __dirname + "/data", fileName.slice(0, fileName.length - 4) + "_cleaned.csv", {
    quote: "",
    delimiter: ";",
  });

  logger.info("All good");
};

const fileName = process.argv[2];

if (!fileName) {
  logger.error("No filename arg passed");
  process.exit(0);
}

sanitizeGestiCsv(fileName);
