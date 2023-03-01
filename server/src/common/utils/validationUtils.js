import Joi from "joi";
import { joiPasswordExtendCore } from "joi-password";
const joiPassword = Joi.extend(joiPasswordExtendCore);

export function passwordSchema(isAdmin = false) {
  return joiPassword
    .string()
    .min(isAdmin ? 20 : 12)
    .minOfSpecialCharacters(1)
    .minOfLowercase(1)
    .minOfUppercase(1)
    .minOfNumeric(1);
}

export function cfdSchema() {
  return Joi.string().regex(/^[0-9A-Z]{8}[A-Z]?$/);
}

export function siretSchema() {
  return Joi.string()
    .regex(/^[0-9]{14}$/)
    .creditCard()
    .error((errors) => {
      // @ts-ignore
      const error = errors[0].local;
      return new Error(
        error.code === "string.base"
          ? `Error: schema not valid : ValidationError: ${error.key} must be a string`
          : error.value
          ? `Error: schema not valid : ValidationError: ${error.key} must follow Luhn algorithm`
          : `Error: schema not valid : ValidationError: empty ${error.key}`
      );
    });
}
// const UAI_REGEX = /^[0-9_]{7}[a-zA-Z]{1}$/;
export function uaiSchema() {
  return Joi.string().regex(/^[0-9]{7}[a-zA-Z]$/);
}

export function validateUai(uai) {
  return uaiSchema().required().validate(uai);
}

const customJoi = Joi.extend((joi) => ({
  type: "arrayOf",
  base: joi.array(),
  // eslint-disable-next-line no-unused-vars
  coerce(value, helpers) {
    return { value: value.split ? value.split(",") : value };
  },
}));

export function arrayOf(itemSchema = Joi.string()) {
  return customJoi.arrayOf().items(itemSchema).single();
}

export async function validateFullObjectSchema(object, schema) {
  return await Joi.object(schema).validateAsync(object, { abortEarly: false });
}
