const XLSX = require("xlsx");
const { parse } = require("json2csv");
const { writeFile, chown } = require("fs").promises;

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
