import { z } from "zod";

export const configurationERPSchema = {
  erps: z.string().array().optional(),
  mode_de_transmission: z.enum(["API", "MANUEL"]).nullable().optional(),
  setup_step_courante: z.enum(["STEP1", "STEP2", "STEP3", "COMPLETE"]).optional(),
};

export type ConfigurationERP = z.infer<z.ZodObject<typeof configurationERPSchema>>;
