import express from "express";
import { z } from "zod";

import { createERP, deleteERPById } from "@/common/actions/erp.actions";
import objectIdSchema from "@/common/validation/objectIdSchema";
import { DefaultParams, DefaultQuery, returnResult, RouteHandler } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const erpBody = z.object({ name: z.string(), helpFilePath: z.string().optional() });
const idParams = objectIdSchema("id");

export default () => {
  const router = express.Router();

  router.post("/", validateRequestMiddleware({ body: erpBody }), returnResult(addERP));
  router.delete("/:id", validateRequestMiddleware({ params: idParams }), returnResult(deleteERP));

  return router;
};

const addERP: RouteHandler<Record<string, unknown>, DefaultParams, DefaultQuery, z.infer<typeof erpBody>> = ({
  body,
}) => {
  const { name, helpFilePath } = body;
  return createERP(name, helpFilePath);
};

const deleteERP: RouteHandler<Record<string, unknown>, z.infer<typeof idParams>> = ({ params }) => {
  const { id } = params;
  return deleteERPById(id);
};
