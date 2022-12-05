import Joi from "joi";

export function passwordSchema(isAdmin = false) {
  return isAdmin
    ? Joi.string().regex(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){20,}$/)
    : Joi.string().regex(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){12,}$/);
}

export function cfdSchema() {
  return Joi.string().regex(/^[0-9A-Z]{8}[A-Z]?$/);
}

export function siretSchema() {
  return Joi.string()
    .regex(/^[0-9]{14}$/)
    .creditCard()
    .error(
      (errors) =>
        new Error(`Error: schema not valid : ValidationError: ${errors[0].local.key} must be follow Luhn algorithm`)
    );
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

export function validate(obj, validators) {
  return Joi.object(validators).validateAsync(obj, { abortEarly: false });
}
