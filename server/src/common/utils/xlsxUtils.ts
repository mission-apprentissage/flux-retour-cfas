import ExcelJs from "exceljs";

export const parseLocalXlsx = async (relativePath: string) => {
  const workbook = new ExcelJs.Workbook();
  const data = await workbook.xlsx.readFile(`static/${relativePath}`);
  return data;
};

export const addSheetToXlscFile = async (
  relativePath: string,
  worksheetList: Array<{ worksheetName: string; logsTag: string; data: Array<any> }>,
  columns: Array<{ name: string; id: string; array?: string; transform?: (d: any) => any }>
) => {
  const workbook = await parseLocalXlsx(relativePath);
  const wsList = workbook.worksheets.map(({ name }) => name);
  const toDelete = worksheetList.map(({ worksheetName }) => worksheetName).filter((x) => !wsList.includes(x));

  toDelete.forEach((element) => workbook.removeWorksheet(element));

  for (const { worksheetName, data } of worksheetList) {
    const ws = workbook.getWorksheet(worksheetName);
    const formattedData = formatJsonToXlsx(data, columns);

    if (!ws) {
      return null;
    }

    ws.addRows(formattedData);
  }

  return workbook;
};

export const formatJsonToXlsx = (
  data: Array<any>,
  format: Array<{ name: string; id: string; array?: string; transform?: (data: any) => any }>
) => {
  const attributeSizeMap = {};
  /**
   * Extenstion du tableau à la taille en entrée (padding)
   * @param arr Le tableau à étendre
   * @param size La taille visé
   * @returns Le nouveau tableau étendu
   */
  const extendArrayWithSize = (arr: Array<any>, size: number) => {
    const l = arr.length;
    return arr.concat(Array(size - l).fill(null));
  };
  /**
   * Création de n column numéroté de 1 à n
   * @param name Le nom de la colonne
   * @returns Un tableau de N string
   */
  const generateNColumnForAttribute = (name, array) => {
    const maxElement = getMaxElementForAttribute(array);
    attributeSizeMap[array] = maxElement;

    if (maxElement > 1) {
      return Array(maxElement)
        .fill(null)
        .map((_, index) => `${name} - n°${index + 0}`);
    } else if (maxElement === 1) {
      return [name];
    }
    return [];
  };

  /**
   * Récupération du maximum d'element pour un attribut au sein d'un tableau
   * @param name Le nom de la colonne
   * @returns La valeur max
   */
  const getMaxElementForAttribute = (arrName) => {
    return data.reduce((maxElement, data) => {
      return data[arrName].length > maxElement ? data[arrName].length : maxElement;
    }, 0);
  };

  // Tableau transformé avec la multiplicité
  const formatHeader = format.reduce((acc, { name, array }) => {
    return array ? [...acc, ...generateNColumnForAttribute(name, array)] : [...acc, name];
  }, [] as Array<string>);

  return [
    formatHeader,
    ...data.map((r) => {
      return format.reduce((acc, { id, transform, array }) => {
        const computeSingleData = (d) => (transform ? transform(d) : d);
        const handleData = () =>
          array
            ? extendArrayWithSize(
                r[array].map((arrAttribute) => computeSingleData(arrAttribute[id])),
                attributeSizeMap[array]
              )
            : [computeSingleData(r[id])];
        return [...acc, ...handleData()];
      }, [] as Array<any>);
    }),
  ];
};
