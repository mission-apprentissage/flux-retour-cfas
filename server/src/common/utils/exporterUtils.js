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

/**
 * Build Xlsx buffer for data & optional headers
 * @param {*} headers
 * @param {*} data
 * @param {*} workbookName
 * @returns
 */
const toXlsxBuffer = async (headers = null, data, workbookName = "") => {
  const workbook = XLSX.utils.book_new();
  let worksheet;

  if (headers !== null) {
    // Add header as ArrayOfArray
    worksheet = XLSX.utils.aoa_to_sheet(headers);

    // Add json data
    const headersSize = headers.length + 1;
    XLSX.utils.sheet_add_json(worksheet, data, { origin: `A${headersSize}` });

    // Merge headers (Full range by default A -> Z cells) & set height to 25 px default
    worksheet["!merges"] = [];
    worksheet["!rows"] = [];
    for (let index = 0; index < headers.length; index++) {
      worksheet["!merges"].push(XLSX.utils.decode_range(`A${index + 1}:Z${index + 1}`));
      worksheet["!rows"].push({ hpx: 25 });
    }
  } else {
    worksheet = XLSX.utils.json_to_sheet(data);
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, workbookName);
  return await XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};
module.exports.toXlsxBuffer = toXlsxBuffer;

/**
 * Parse xlsx stream with headers to JSON data
 * @param {*} stream
 * @param {*} headersLength
 * @param {*} mergedHeaders
 * @returns
 */
const parseXlsxHeaderStreamToJson = (stream, headersLength = 0, mergedHeaders = true) => {
  // Gets worksheet
  var workbook = XLSX.read(stream, { type: "buffer" });
  var ws = workbook.Sheets[workbook.SheetNames[0]];

  // Remove merge if needed
  if (mergedHeaders === true) {
    ws["!merges"] = [];
  }

  // Identify data using refs
  var dataRef = XLSX.utils.decode_range(ws["!ref"]);
  dataRef.s.r += headersLength;
  ws["!ref"] = XLSX.utils.encode_range(dataRef);
  return XLSX.utils.sheet_to_json(ws);
};
module.exports.parseXlsxHeaderStreamToJson = parseXlsxHeaderStreamToJson;
