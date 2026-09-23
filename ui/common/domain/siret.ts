export const siretRegex = /^[0-9]{14}$/;

export const validateSiret = (siret: string | null | undefined) => Boolean(siret) && siretRegex.test(siret ?? "");
