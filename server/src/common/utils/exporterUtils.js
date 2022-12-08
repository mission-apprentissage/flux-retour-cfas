import XLSX from "xlsx";
import { parse } from "json2csv";
import { writeFile, chown } from "fs/promises";

export const toXlsx = async (data, outputDirectoryFileName, workbookName = "", options = {}) => {
  const workbook = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(workbook, ws, workbookName);
  await XLSX.writeFile(workbook, outputDirectoryFileName, { type: "file" });

  if (options.owner) {
    await chown(outputDirectoryFileName, options.owner.uid, options.owner.gid);
  }
};

export const toCsv = async (data, outputDirectoryFileName, options = {}) => {
  const csvData = parse(data, { delimiter: options.delimiter || ",", quote: "" });

  await writeFile(outputDirectoryFileName, options.utf8Bom === true ? "\ufeff" + csvData : csvData, "utf8");

  if (options.owner) {
    await chown(outputDirectoryFileName, options.owner.uid, options.owner.gid);
  }
};
