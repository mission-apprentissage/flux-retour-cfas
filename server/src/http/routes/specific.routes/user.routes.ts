import express from "express";
import { effectifCreationSchema } from "shared/models/apis/effectifsCreationSchema";

import { usersMigrationDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get("/effectif-draft", returnResult(getUserDraft));

  router.put(
    "/effectif-draft",
    validateRequestMiddleware({ body: effectifCreationSchema.deepPartial() }),
    returnResult(updateUserDraft)
  );
  return router;
};

const getUserDraft = async (req) => {
  const user = req.user as AuthContext;
  const found = await usersMigrationDb().findOne({ _id: user._id });
  return found?.draft_effectif_form ?? {};
};

const updateUserDraft = async (req) => {
  const user = req.user as AuthContext;
  const updated = await usersMigrationDb().findOneAndUpdate(
    {
      _id: user._id,
    },
    {
      $set: {
        draft_effectif_form: req.body,
      },
    }
  );
  return updated.value?.draft_effectif_form;
};
