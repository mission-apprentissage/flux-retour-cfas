import csvToJson from "convert-csv-to-json";

export const readJsonFromCsvFile = (fileInputName, delimiter = ";") => {
  csvToJson.fieldDelimiter(delimiter);
  return csvToJson.getJsonFromCsv(fileInputName);
};
