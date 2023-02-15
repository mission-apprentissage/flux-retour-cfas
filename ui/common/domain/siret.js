export const siretRegex = /^[0-9]{14}$/;

//TODO merge with siretRegex
export const SIRET_REGEX = new RegExp("^([0-9]{14}|[0-9]{9} [0-9]{4})$");

export const validateSiret = (siret) => Boolean(siret) && siretRegex.test(siret);
