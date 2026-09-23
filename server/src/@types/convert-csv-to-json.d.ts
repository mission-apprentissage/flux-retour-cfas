declare module "convert-csv-to-json" {
  interface CsvToJson {
    fieldDelimiter(delimiter: string): CsvToJson;
    getJsonFromCsv(fileInputName: string): Record<string, string>[];
  }

  const csvToJson: CsvToJson;
  export default csvToJson;
}
