export const validateUai = (uai) => {
  return Boolean(uai) && /^[0-9_]{7}[a-zA-Z]{1}$/.test(uai);
};
