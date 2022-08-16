const csvToJson = require("convert-csv-to-json");

const readJsonFromCsvFile = (fileInputName, delimiter = ";") => {
  csvToJson.fieldDelimiter(delimiter);
  return csvToJson.getJsonFromCsv(fileInputName);
};

module.exports.readJsonFromCsvFile = readJsonFromCsvFile;
