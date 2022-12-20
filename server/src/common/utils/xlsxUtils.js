import XLSX from "xlsx";

const readXLSXData = (data) => {
  try {
    const workbook = XLSX.read(data, { codepage: 65001 });

    return { sheet_name_list: workbook.SheetNames, workbook };
  } catch (error) {
    return null;
  }
};

export const getJsonFromXlsxData = (data, opt = { raw: false }) => {
  try {
    const { sheet_name_list, workbook } = readXLSXData(data);
    const worksheet = workbook.Sheets[sheet_name_list[0]];
    const json = XLSX.utils.sheet_to_json(worksheet, opt);

    return json;
  } catch (err) {
    return null;
  }
};
