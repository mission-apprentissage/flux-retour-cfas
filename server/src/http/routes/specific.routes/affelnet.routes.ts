import Boom from "boom";
import express from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

//import parentLogger from "@/common/logger";
import { voeuxAffelnetDb } from "@/common/model/collections";
import { requireVoeuOrganismePermission, returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

// const logger = parentLogger.child({
//   module: "affelnet-route",
// });

const updateContactedRequest = z.object({
  is_contacted: z.coerce.boolean(),
});
type UpdateContactedRequestType = z.infer<typeof updateContactedRequest>;

export default () => {
  const router = express.Router();

  router.put(
    "/:id/update-contacted",
    requireVoeuOrganismePermission("manageEffectifs"),
    validateRequestMiddleware({ body: updateContactedRequest }),
    returnResult(updateContacted)
  );

  return router;
};

const updateContacted = async (req) => {
  try {
    const { is_contacted } = req.body as UpdateContactedRequestType;
    const voeuId = new ObjectId(req.params.id) as ObjectId;

    await voeuxAffelnetDb().updateOne({ _id: voeuId }, { $set: { is_contacted: is_contacted } });
    return await voeuxAffelnetDb().findOne(
      { _id: voeuId },
      {
        projection: {
          _id: 1,
          nom: "$raw.nom",
          prenom: "$raw.prenom_1",
          rang: "$raw.rang",
          formation: "$_computed.formation",
          email_1: "$raw.mail_responsable_1",
          email_2: "$raw.mail_responsable_2",
          is_contacted: "$is_contacted",
        },
      }
    );
  } catch (e) {
    throw Boom.badRequest();
  }
};
