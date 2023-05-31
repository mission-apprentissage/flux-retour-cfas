import { z } from "zod";

export const SReqPostDossiers = {
  siret: z.string(),
  uai: z.string(),
  erp: z.string(),
};
export type IReqPostDossiers = z.infer<z.ZodObject<typeof SReqPostDossiers>>;

export const SReqPostVerifyUser = {
  siret: z.string(),
  uai: z.string(),
  erp: z.string(),
  api_key: z.string(),
};
export type IReqPostVerifyUser = z.infer<z.ZodObject<typeof SReqPostVerifyUser>>;
