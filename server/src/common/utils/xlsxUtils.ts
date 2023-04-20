import XLSX from "xlsx";

const readXLSXData = (data, readOpt = { codepage: 65001, cellDates: true, dateNF: "dd/MM/yyyy" }) => {
  const workbook = XLSX.read(data, readOpt);
  return { sheet_name_list: workbook.SheetNames, workbook };
};

export const getJsonFromXlsxData = (
  data: any,
  opt: any = { raw: false },
  readOpt: any = { codepage: 65001, cellDates: true, dateNF: "dd/MM/yyyy" }
) => {
  try {
    const { sheet_name_list, workbook } = readXLSXData(data, readOpt);
    const worksheet = workbook.Sheets[sheet_name_list[0]];
    const json = XLSX.utils.sheet_to_json<any>(worksheet, opt);

    return json;
  } catch (err) {
    return null;
  }
};
