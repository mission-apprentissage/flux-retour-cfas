import express from "express";
import { z } from "zod";

import { createERP, deleteERPById } from "@/common/actions/erp.actions";
import objectIdSchema from "@/common/validation/objectIdSchema";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.post(
    "/",
    validateRequestMiddleware({
      body: z.object({ name: z.string() }),
    }),
    returnResult(addERP)
  );

  router.delete(
    "/:id",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    returnResult(deleteERP)
  );

  return router;
};

const addERP = ({ body }) => {
  const { name } = body;
  return createERP(name);
};

const deleteERP = ({ params }) => {
  const { id } = params;
  return deleteERPById(id);
};
