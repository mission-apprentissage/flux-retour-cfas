import Boom from "boom";
import { z, ZodError } from "zod";

export async function validateFullZodObjectSchema<Shape extends z.ZodRawShape>(
  object: unknown,
  schemaShape: Shape
): Promise<z.infer<z.ZodObject<Shape>>> {
  return await z.strictObject(schemaShape).parseAsync(object);
}

/** `issues` et `details` sont lus par des consommateurs externes : ne pas en changer la forme. */
export function toValidationError(zodError: ZodError): Boom {
  const boomError = Boom.badRequest("Erreur de validation");
  const payload = boomError.output.payload as Boom.Payload & { issues?: unknown; details?: unknown };
  payload.issues = zodError.issues;
  payload.details = zodError.issues[0]?.message;
  return boomError;
}
