import Joi from "joi";

const schema = Joi.string().email();

export const validateEmail = (value) => {
  return schema.validate(value);
};
