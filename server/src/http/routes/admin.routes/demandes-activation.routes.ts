import * as Boom from "@hapi/boom";
import express, { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import multer from "multer";
import { zModificationDemandeActivation } from "shared/models/routes/admin/demandes-activation.api";
import { z } from "zod";

import {
  importerDemandesActivation,
  listerDemandesActivation,
  modifierDemandeActivation,
  TAILLE_MAX_IMPORT_DEMANDES,
} from "@/common/actions/admin/demandes-activation.actions";
import objectIdSchema from "@/common/validation/objectIdSchema";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAILLE_MAX_IMPORT_DEMANDES, files: 1 },
  defParamCharset: "utf8",
});

const recevoirFichier: RequestHandler = (req, res, next) =>
  upload.single("fichier")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      return next(
        Boom.badRequest(err.code === "LIMIT_FILE_SIZE" ? "Fichier trop volumineux (1 Mo maximum)" : err.message)
      );
    }
    next(err);
  });

export default () => {
  const router = express.Router();

  router.get(
    "/",
    returnResult(async () => listerDemandesActivation())
  );

  router.put(
    "/:id",
    validateRequestMiddleware({ params: objectIdSchema("id"), body: zModificationDemandeActivation }),
    returnResult(async ({ params, body }) => modifierDemandeActivation(new ObjectId(params.id), body))
  );

  router.post(
    "/import",
    recevoirFichier,
    returnResult(async (req) => {
      if (!req.file) {
        throw Boom.badRequest("Aucun fichier reçu");
      }
      const source = z
        .string()
        .trim()
        .min(1)
        .catch(req.file.originalname)
        .parse((req.body as { source?: unknown } | undefined)?.source);
      return importerDemandesActivation(req.file, source);
    })
  );

  return router;
};
