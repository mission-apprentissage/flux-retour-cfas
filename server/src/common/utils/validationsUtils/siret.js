import Joi from "joi";

const SIRET_REGEX = /^[0-9]{14}$/;

export const schema = Joi.string().length(14).pattern(SIRET_REGEX);

export const validateSiret = (siret) => {
  return schema.required().validate(siret);
};
