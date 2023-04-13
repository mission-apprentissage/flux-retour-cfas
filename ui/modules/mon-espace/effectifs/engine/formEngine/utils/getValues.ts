import setWith from "lodash.setwith";

export const getValues = (fields: Record<string, any>) => {
  if (!fields) return undefined;
  const values = {};
  Object.entries(fields).forEach(([key, field]) => {
    setWith(values, key, field.value);
  });
  return values;
};
