import Boom from "boom";
import { z, ZodError } from "zod";

export async function validateFullZodObjectSchema<Shape extends z.ZodRawShape>(
  object: unknown,
  schemaShape: Shape
): Promise<z.infer<z.ZodObject<Shape>>> {
  return await z.strictObject(schemaShape).parseAsync(object);
}

/**
 * Normalise une ZodError en Boom 400. La charge utile reproduit à l'identique celle
 * que construisait errorMiddleware : `issues` porte le détail complet, `details` le
 * premier message — deux champs que des consommateurs externes peuvent lire.
 */
export function toValidationError(zodError: ZodError): Boom {
  const boomError = Boom.badRequest("Erreur de validation");
  const payload = boomError.output.payload as Boom.Payload & { issues?: unknown; details?: unknown };
  payload.issues = zodError.issues;
  payload.details = zodError.issues[0]?.message;
  return boomError;
}
