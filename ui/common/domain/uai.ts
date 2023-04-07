export const UAI_REGEX = /^[0-9_]{7}[a-zA-Z]{1}$/;

export const validateUai = (uai) => UAI_REGEX.test(uai);
