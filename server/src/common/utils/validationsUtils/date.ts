import Joi from "joi";

export const schema = Joi.string()
  .regex(/^([0-9]{4})-([0-9]{2})-([0-9]{2})/) // make sure the passed date contains at least YYYY-MM-DD
  .custom((val, helpers) => {
    const { value, error } = Joi.date().iso().validate(val);
    return error ? helpers.error("string.isoDate") : value;
  });
