import { z } from "zod";

export const configurationERPSchema = {
  erps: z.string().toLowerCase().array().optional(),
  mode_de_transmission: z.enum(["API", "MANUEL"]).optional(),
  erp_unsupported: z.string().optional(),
};

export type ConfigurationERP = z.infer<z.ZodObject<typeof configurationERPSchema>>;
