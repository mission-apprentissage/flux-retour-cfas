import { z } from "zod";

export async function validateFullZodObjectSchema<Shape extends z.ZodRawShape>(
  object: any,
  schemaShape: Shape
): Promise<z.infer<z.ZodObject<Shape>>> {
  return await z.strictObject(schemaShape).parseAsync(object);
}
