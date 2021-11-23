export const uaiRegex = /^[0-9_]{7}[a-zA-Z]{1}$/;
export const validateUai = (uai) => Boolean(uai) && uaiRegex.test(uai);
