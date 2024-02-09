import Joi from "joi";
import { joiPasswordExtendCore } from "joi-password";
import { UAI_REGEX } from "shared";
import { z } from "zod";

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

export function isValidUAI(uai: string) {
  return UAI_REGEX.test(uai);
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
