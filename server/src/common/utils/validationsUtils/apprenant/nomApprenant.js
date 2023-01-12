import Joi from "joi";

export const schema = Joi.string().min(1);

export const validateNomApprenant = (value) => {
  return schema.validate(value);
};

export const normalizeNomApprenant = (value) => {
  return typeof value === "string" ? value.toUpperCase().trim() : value;
};
