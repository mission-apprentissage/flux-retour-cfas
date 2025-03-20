import ExcelJs from "exceljs";

export const parseLocalXlsx = async (relativePath: string) => {
  const workbook = new ExcelJs.Workbook();
  const data = await workbook.xlsx.readFile(`static/${relativePath}`);
  return data;
};

export const addSheetToXlscFile = async (
  relativePath: string,
  worksheetToKeepName: string,
  worksheetToDeleteName: string,
  columns: Array<{ name: string; id: string; transform?: (d: any) => any }>,
  data: Array<any>
) => {
  const formattedData = formatJsonToXlsx(data, columns);
  const workbook = await parseLocalXlsx(relativePath);
  const ws = await workbook.getWorksheet(worksheetToKeepName);
  workbook.removeWorksheet(worksheetToDeleteName);
  if (!ws) {
    return null;
  }
  ws.addRows(formattedData);
  return workbook;
};

export const formatJsonToXlsx = (
  data: Array<any>,
  format: Array<{ name: string; id: string; transform?: (data: any) => any }>
) => {
  return [
    format.map(({ name }) => name),
    ...data.map((r) => {
      return format.map(({ id, transform }) => {
        return transform ? transform(r[id]) : r[id];
      });
    }),
  ];
};
