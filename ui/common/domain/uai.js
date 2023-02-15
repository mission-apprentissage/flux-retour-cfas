export const uaiRegex = /^[0-9_]{7}[a-zA-Z]{1}$/;

//TODO merge with uaiRegex
export const UAI_REGEX = new RegExp("^([0-9]{7}[A-Z]{1})$");

export const validateUai = (uai) => Boolean(uai) && uaiRegex.test(uai);
