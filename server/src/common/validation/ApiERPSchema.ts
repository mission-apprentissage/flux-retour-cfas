import { z } from "zod";

export const SReqPostVerifyUser = {
  siret: z.string(),
  uai: z.string(),
  erp: z.string(),
  api_key: z.string(),
};
export type IReqPostVerifyUser = z.infer<z.ZodObject<typeof SReqPostVerifyUser>>;
