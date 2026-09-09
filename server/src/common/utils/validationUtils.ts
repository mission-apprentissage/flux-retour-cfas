import { z } from "zod";

export async function validateFullZodObjectSchema<Shape extends z.ZodRawShape>(
  object: unknown,
  schemaShape: Shape
): Promise<z.infer<z.ZodObject<Shape>>> {
  return await z.strictObject(schemaShape).parseAsync(object);
}
