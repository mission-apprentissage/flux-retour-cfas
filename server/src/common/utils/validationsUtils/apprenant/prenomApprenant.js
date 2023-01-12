import Joi from "joi";

export const schema = Joi.string().min(1);

export const validatePrenomApprenant = (value) => {
  return schema.validate(value);
};

export const normalizePrenomApprenant = (value) => {
  return typeof value === "string" ? value.toUpperCase().trim() : value;
};
