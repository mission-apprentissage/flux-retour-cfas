import { NextFunction, Response } from "express";
import { WithId } from "mongodb";
import { z } from "zod";

import { Organisme } from "@/common/model/@types";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";

const ZReqPostDossiersSchema = {
  siret: z.string(),
  uai: z.string(),
  erp: z.string(),
};
export type IReqPostDossiersSchema = z.infer<z.ZodObject<typeof ZReqPostDossiersSchema>>;

// TODO FIXME req: any instead of Request overload
export default function requireSendEffectifsPermissionMiddleware() {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const organisme = req.user as WithId<Organisme>;
      const queryPayload = await validateFullZodObjectSchema(req.query, ZReqPostDossiersSchema);

      if (organisme.siret !== queryPayload.siret) {
        // TODO WHAT DO WE DO
        // return res
        // .status(200)
        // .redirect("/SOMEWHERE");
      } else if (organisme.uai !== queryPayload.uai) {
        // TODO WHAT DO WE DO
        // return res
        // .status(200)
        // .redirect("/SOMEWHERE");
      }

      req.user = {
        ...req.user,
        source: queryPayload.erp,
      };
      next();
    } catch (err) {
      next(err);
    }
  };
}
