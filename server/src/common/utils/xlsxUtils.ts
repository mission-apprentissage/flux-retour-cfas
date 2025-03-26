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
  columns: Array<{ name: string; id: string; array: string; transform?: (d: any) => any }>,
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
  format: Array<{ name: string; id: string; array: string; transform?: (data: any) => any }>
) => {
  /**
   * Création de n column numéroté de 1 à n
   * @param name Le nom de la colonne
   * @returns Un tableau de N string
   */
  const generateNColumnForAttribute = (name, array) => {
    const maxElement = getMaxElementForAttribute(array);
    return Array(maxElement)
      .fill(null)
      .map((_, index) => `${name} - n°${index + 1}`);
  };

  /**
   * Récupération du maximum d'element pour un attribut au sein d'un tableau
   * @param name Le nom de la colonne
   * @returns La valeur max
   */
  const getMaxElementForAttribute = (arrName) => {
    console.log(data, arrName);
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
          array ? r[array].map((arrAttribute) => computeSingleData(arrAttribute[id])) : [computeSingleData(r[id])];
        return [...acc, ...handleData()];
      }, [] as Array<any>);
    }),
  ];
};
