import express from "express";
import Joi from "joi";
import {
  createMaintenanceMessage,
  updateMaintenanceMessage,
  removeMaintenanceMessage,
} from "../../../common/actions/maintenances.actions";
import tryCatch from "../../middlewares/tryCatchMiddleware";

export default () => {
  const router = express.Router();

  router.post(
    "/",
    tryCatch(async ({ body, user }, res) => {
      let { msg, type, enabled, context } = await Joi.object({
        msg: Joi.string().required(),
        type: Joi.string().required(),
        enabled: Joi.boolean().required(),
        context: Joi.string().required(),
      }).validateAsync(body, { abortEarly: false });

      if (!msg || enabled === undefined) {
        return res.status(400).send({ error: "Erreur avec le message ou enabled" });
      }
      const newMaintenanceMessage = await createMaintenanceMessage({
        type,
        context,
        name: user.email,
        // TODO quick bypass https://github.com/coreruleset/coreruleset/blob/v4.1/dev/rules/REQUEST-949-BLOCKING-EVALUATION.conf
        msg: msg.replace(/(\[.*?\])\(##(.*?)\)/gim, "$1($2)"),
        enabled,
        time: new Date(),
      });

      return res.status(201).json(newMaintenanceMessage);
    })
  );

  router.put(
    "/:id",
    tryCatch(async ({ body, params }, res) => {
      const { msg, type, context, enabled } = body;
      const itemId = params.id;

      if (!msg || !type || !context) {
        return res.status(400).send({ error: "Erreur avec le message ou avec le nom ou le type" });
      }

      const result = await updateMaintenanceMessage(itemId, { msg, type, context, enabled });

      return res.json(result);
    })
  );

  router.delete(
    "/:id",
    tryCatch(async (req, res) => {
      const itemId = req.params.id;
      const result = await removeMaintenanceMessage(itemId);
      return res.json(result);
    })
  );

  return router;
};
