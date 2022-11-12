export const pick = (obj = {}, keys = []) => {
  return keys.reduce((acc, key) => {
    return obj[key] !== undefined ? { ...acc, [key]: obj[key] } : acc;
  }, {});
};
