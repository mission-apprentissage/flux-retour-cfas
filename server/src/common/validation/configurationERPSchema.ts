import { z } from "zod";

export const configurationERPSchema = {
  erpId: z.string().optional(),
  mode_de_transmission: z.enum(["API", "MANUEL"]).optional(),
};

export type ConfigurationERP = z.infer<z.ZodObject<typeof configurationERPSchema>>;
