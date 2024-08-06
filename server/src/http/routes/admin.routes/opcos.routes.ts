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
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllOpcos));
  router.get("/:id/rncp", validateRequestMiddleware({ params: objectIdSchema("id") }), returnResult(getRNCPByOpcosId));
  router.post(
    "/:id/rncp",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
      body: z.object({ rncp: z.array(z.string()) }),
    }),
    returnResult(postRNCPByOpcosId)
  );
  router.delete(
    "/:id/rncp",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
      body: z.object({ rncp: z.array(z.string()) }),
    }),
    returnResult(deleteRNCPByOpcosId)
  );
  return router;
};

const getAllOpcos = async () => {
  return findAllOpcos();
};

const getRNCPByOpcosId = async (req) => {
  const { id } = req.params;
  return findRNCPByOpcosId(id);
};

const postRNCPByOpcosId = async (req) => {
  const { id } = req.params;
  const { rncp }: { rncp: Array<string> } = req.body;
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

    await createRNCPByOpcos(opco, rncpFiche);
  }
  return { errors };
};

const deleteRNCPByOpcosId = async (req) => {
  const { id } = req.params;
  const { rncp }: { rncp: Array<string> } = req.body;
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
