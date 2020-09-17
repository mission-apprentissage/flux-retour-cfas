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

const toXlsx = async (data, outputDirectory, fileName, workbookName, options) => {
  const workbook = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  const file = `${outputDirectory}/${fileName}`;

  XLSX.utils.book_append_sheet(workbook, ws, workbookName);
  await XLSX.writeFile(workbook, file, { type: "file" });

  if (options.owner) {
    await chown(file, options.owner.uid, options.owner.gid);
  }
};
module.exports.toXlsx = toXlsx;

const toCsv = async (data, outputDirectory, fileName, options = {}) => {
  const file = `${outputDirectory}/${fileName}`;
  const csvData = parse(data, { delimiter: options.delimiter || "," });

  await writeFile(file, options.utf8Bom === true ? "\ufeff" + csvData : csvData, "utf8");

  if (options.owner) {
    await chown(file, options.owner.uid, options.owner.gid);
  }
};
module.exports.toCsv = toCsv;
