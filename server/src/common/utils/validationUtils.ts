import Joi from "joi";
import { joiPasswordExtendCore } from "joi-password";
import { z } from "zod";
import { SIRET_REGEX, UAI_REGEX } from "../constants/organisme";
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
    .regex(SIRET_REGEX)
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
export function uaiSchema() {
  return Joi.string().regex(UAI_REGEX);
}

export function validateUai(uai) {
  return uaiSchema().required().validate(uai);
}

export async function validateFullObjectSchema<T = any>(object, schema): Promise<T> {
  return await Joi.object(schema).validateAsync(object, { abortEarly: false });
}

// nom un peu verbeux qu'on pourra simplifier quand tout sera migré à zod
export async function validateFullZodObjectSchema<Shape extends z.ZodRawShape>(
  object: any,
  schemaShape: Shape
): Promise<z.infer<z.ZodObject<Shape>>> {
  return await z.strictObject(schemaShape).parseAsync(object);
}

export async function validateFullObjectSchemaUnknown<T = any>(object, schema): Promise<T> {
  return await Joi.object(schema).validateAsync(object, { abortEarly: false, allowUnknown: true });
}
