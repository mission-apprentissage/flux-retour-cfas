export const siretRegex = /^[0-9]{14}$/;

export const validateSiret = (siret) => Boolean(siret) && siretRegex.test(siret);
