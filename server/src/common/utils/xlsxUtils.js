import XLSX from "xlsx";

const readXLSXData = (data, readOpt = { codepage: 65001, cellDates: true, dateNF: "dd/MM/yyyy" }) => {
  try {
    const workbook = XLSX.read(data, readOpt);

    return { sheet_name_list: workbook.SheetNames, workbook };
  } catch (error) {
    return null;
  }
};

export const getJsonFromXlsxData = (
  data,
  opt = { raw: false },
  readOpt = { codepage: 65001, cellDates: true, dateNF: "dd/MM/yyyy" }
) => {
  try {
    const { sheet_name_list, workbook } = readXLSXData(data, readOpt);
    const worksheet = workbook.Sheets[sheet_name_list[0]];
    const json = XLSX.utils.sheet_to_json(worksheet, opt);

    return json;
  } catch (err) {
    return null;
  }
};
