import Joi from "joi";

export const schema = Joi.string().email();

export const validateEmail = (value) => {
  return schema.validate(value);
};
