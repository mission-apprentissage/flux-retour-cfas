import Joi from "joi";

export const schema = Joi.string().regex(/^\d{4}-\d{4}$/);

export const validateAnneeScolaire = (value) => {
  return schema.validate(value);
};
