export const formatJsonToXlsx = (data: Array<any>, format: Array<string>) => {
  return [
    format,
    ...data.map((r) => {
      return format.map((key) => r[key]);
    }),
  ];
};
