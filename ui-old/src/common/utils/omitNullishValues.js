export const omitNullishValues = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    return value === null || value === undefined ? acc : { ...acc, [key]: value };
  }, {});
};
