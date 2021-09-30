const XLSX = require("xlsx");
const { parse } = require("json2csv");
const { writeFile, chown } = require("fs").promises;

const toWorksheet = (collection = null, name) => {
  if (!collection) return;

  const jsonArray = Array.from(collection.values());

  return {
    name,
    content: XLSX.utils.json_to_sheet(jsonArray), // Converts an array of JS objects to a worksheet
  };
};
module.exports.toWorksheet = toWorksheet;

const toXlsx = async (data, outputDirectoryFileName, workbookName = "", options = {}) => {
  const workbook = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(workbook, ws, workbookName);
  await XLSX.writeFile(workbook, outputDirectoryFileName, { type: "file" });

  if (options.owner) {
    await chown(outputDirectoryFileName, options.owner.uid, options.owner.gid);
  }
};
module.exports.toXlsx = toXlsx;

const toCsv = async (data, outputDirectoryFileName, options = {}) => {
  const csvData = parse(data, { delimiter: options.delimiter || "," });

  await writeFile(outputDirectoryFileName, options.utf8Bom === true ? "\ufeff" + csvData : csvData, "utf8");

  if (options.owner) {
    await chown(outputDirectoryFileName, options.owner.uid, options.owner.gid);
  }
};
module.exports.toCsv = toCsv;

const toDataCsv = async (data) => {
  const csvData = parse(data);
  await writeFile(csvData, "utf8");
};
module.exports.toDataCsv = toDataCsv;
