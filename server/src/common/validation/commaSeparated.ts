import { z } from "zod";

export const zCommaSeparated = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value: unknown) => (typeof value === "string" ? value.split(",") : value), z.array(schema));
