import Boom from "boom";
import express from "express";
import { z } from "zod";

import {
  createRNCPByOpcos,
  findAllOpcos,
  findOpco,
  findRNCPByOpcosId,
  removeRNCPByOpcos,
} from "@/common/actions/opcos/opcos.actions";
import { getFicheRNCP } from "@/common/actions/rncp.actions";
import logger from "@/common/logger";
import objectIdSchema from "@/common/validation/objectIdSchema";
import { DefaultQuery, returnResult, RouteHandler } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const idParams = objectIdSchema("id");
const rncpBody = z.object({ rncp: z.array(z.string()) });
type OpcoHandler = RouteHandler<
  Record<string, unknown>,
  z.infer<typeof idParams>,
  DefaultQuery,
  z.infer<typeof rncpBody>
>;

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllOpcos));
  router.get("/:id/rncp", validateRequestMiddleware({ params: idParams }), returnResult(getRNCPByOpcosId));
  router.post(
    "/:id/rncp",
    validateRequestMiddleware({ params: idParams, body: rncpBody }),
    returnResult(postRNCPByOpcosId)
  );
  router.delete(
    "/:id/rncp",
    validateRequestMiddleware({ params: idParams, body: rncpBody }),
    returnResult(deleteRNCPByOpcosId)
  );
  return router;
};

const getAllOpcos = async () => {
  return findAllOpcos();
};

const getRNCPByOpcosId: RouteHandler<Record<string, unknown>, z.infer<typeof idParams>> = async (req) => {
  const { id } = req.params;
  return findRNCPByOpcosId(id);
};

const postRNCPByOpcosId: OpcoHandler = async (req) => {
  const { id } = req.params;
  const { rncp } = req.body;
  const errors: Array<string> = [];

  const opco = await findOpco(id);
  if (!opco) {
    throw Boom.notFound(`Opco with id ${id} not found`);
  }

  logger.info(`Adding ${rncp.length} rncp to opco ${opco.name}`);
  for (let i = 0; i < rncp.length; i++) {
    const rncpFiche = await getFicheRNCP(rncp[i]);
    logger.info(`Adding rncp ${rncp[i]} to opco ${opco.name}`, `${i + 1}/${rncp.length}`);
    if (!rncpFiche) {
      errors.push(rncp[i]);
      continue;
    }
    try {
      await createRNCPByOpcos(opco, rncpFiche);
    } catch (e) {
      logger.error(`Error while adding rncp ${rncp[i]} to opco ${opco.name}`, e);
    }
  }
  return { errors };
};

const deleteRNCPByOpcosId: OpcoHandler = async (req) => {
  const { id } = req.params;
  const { rncp } = req.body;
  const errors: Array<string> = [];

  const opco = await findOpco(id);
  if (!opco) {
    throw Boom.notFound(`Opco with id ${id} not found`);
  }

  for (let i = 0; i < rncp.length; i++) {
    const rncpFiche = await getFicheRNCP(rncp[i]);
    if (!rncpFiche) {
      errors.push(rncp[i]);
      continue;
    }

    await removeRNCPByOpcos(opco, rncpFiche);
  }
  return { errors };
};
