import ExcelJs from "exceljs";

import logger from "@/common/logger";

export const parseLocalXlsx = async (relativePath: string) => {
  const workbook = new ExcelJs.Workbook();
  const data = await workbook.xlsx.readFile(`static/${relativePath}`);
  return data;
};

export interface XlsxColumn {
  name: string;
  id: string;
  array?: string;
  transform?: (d: unknown) => unknown;
  listValues?: string[];
}

export const addSheetToXlscFile = async (
  relativePath: string,
  worksheetList: Array<{ worksheetName: string; logsTag: string; data: Array<object> }>,
  columns: XlsxColumn[]
) => {
  const workbook = await parseLocalXlsx(relativePath);
  const wsList = workbook.worksheets.map(({ name }) => name);
  const toDelete = wsList.filter((x) => !worksheetList.map(({ worksheetName }) => worksheetName).includes(x));
  toDelete.forEach((element) => {
    try {
      workbook.removeWorksheet(element);
    } catch (error) {
      logger.warn(`Impossible de supprimer la feuille Excel ${element}`);
    }
  });

  for (const { worksheetName, data } of worksheetList) {
    let ws = workbook.getWorksheet(worksheetName);
    if (!ws) {
      ws = workbook.addWorksheet(worksheetName);
    }

    const formattedData = formatJsonToXlsx(data, columns);
    ws.addRows(formattedData);
    applyDataValidationLists(ws, columns);
  }

  return workbook;
};

function applyDataValidationLists(
  ws: ExcelJs.Worksheet,
  columns: Array<{
    name: string;
    listValues?: string[];
  }>
) {
  const headerRow = ws.getRow(1);

  headerRow.eachCell((cell, colNumber) => {
    const colConfig = columns.find((c) => c.name === cell.value);

    if (colConfig?.listValues && colConfig.listValues.length > 0) {
      ws.getColumn(colNumber).eachCell({ includeEmpty: true }, (c, rowNumber) => {
        if (rowNumber === 1) return;
        c.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [`"${colConfig.listValues!.join(",")}"`],
        };
      });
    }
  });
}

export const formatJsonToXlsx = (data: Array<object>, format: XlsxColumn[]): unknown[][] => {
  const attributeSizeMap: Record<string, number> = {};
  const rows = data as Array<Record<string, unknown>>;

  const getMaxElementForAttribute = (arrName: string) => {
    return rows.reduce((maxElement, obj) => {
      const arr = obj[arrName];
      if (!Array.isArray(arr)) return maxElement;
      return arr.length > maxElement ? arr.length : maxElement;
    }, 0);
  };

  const generateNColumnForAttribute = (colName: string, arrayField: string) => {
    const maxEl = getMaxElementForAttribute(arrayField);
    attributeSizeMap[arrayField] = maxEl;
    if (maxEl > 1) {
      return Array(maxEl)
        .fill(null)
        .map((_, index) => `${colName} - n°${index}`);
    } else if (maxEl === 1) {
      return [colName];
    }
    return [];
  };

  const formatHeader = format.reduce((acc: string[], { name, array }) => {
    return array ? [...acc, ...generateNColumnForAttribute(name, array)] : [...acc, name];
  }, []);

  const formattedRows = rows.map((item) => {
    return format.reduce((rowAcc: unknown[], { id, transform, array }) => {
      const computeSingleData = (val: unknown) => (transform ? transform(val) : val);

      if (array) {
        const arrValues = item[array];
        const extended = (Array.isArray(arrValues) ? arrValues : []).map((arrAttr: Record<string, unknown>) =>
          computeSingleData(arrAttr[id] ?? null)
        );

        const neededSize = attributeSizeMap[array] || 0;
        return [...rowAcc, ...extendArrayWithSize(extended, neededSize)];
      } else {
        return [...rowAcc, computeSingleData(item[id])];
      }
    }, []);
  });

  return [formatHeader, ...formattedRows];
};

function extendArrayWithSize(arr: unknown[], size: number): unknown[] {
  const diff = size - arr.length;
  if (diff > 0) {
    return arr.concat(Array(diff).fill(null));
  }
  return arr;
}
