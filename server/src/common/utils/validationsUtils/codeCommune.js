import Joi from "joi";

const CODE_COMMUNE_REGEX = /^([0-9]{2}|2A|2B)[0-9]{3}$/;

export const schema = Joi.string().pattern(CODE_COMMUNE_REGEX);

export const validateCodeCommune = (value) => {
  return schema.validate(value);
};
