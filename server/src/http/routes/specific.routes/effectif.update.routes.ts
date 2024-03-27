import Boom from "boom";
import express from "express";
import { ObjectId } from "mongodb";

import { effectifsDb } from "@/common/model/collections";
import {
  effectifCreationContratsSchema,
  effectifCreationFormationSchema,
  effectifCreationCoordonnesSchema,
  IEffectifCreationContratsSchema,
  IEffectifCreationFormationSchema,
  IEffectifCreationCoordonnesSchema,
} from "@/common/validation/effectifsCreationSchema";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.put(
    "/coordonnees",
    validateRequestMiddleware({ body: effectifCreationCoordonnesSchema }),
    returnResult(updateCoordonnees)
  );
  router.put(
    "/formation",
    validateRequestMiddleware({ body: effectifCreationFormationSchema }),
    returnResult(updateFormation)
  );
  router.put(
    "/contrats",
    validateRequestMiddleware({ body: effectifCreationContratsSchema }),
    returnResult(updateContrats)
  );

  return router;
};

const updateCoordonnees = async (req, res) => {
  const effectifId = res.locals.effectifId;
  const effectifDb = await effectifsDb().findOne({ _id: effectifId });
  if (!effectifDb) {
    throw Boom.notFound(`Unable to find effectif ${effectifId.toString()}`);
  }

  const body: IEffectifCreationCoordonnesSchema = req.body;
  return await effectifsDb().updateOne(
    { _id: effectifDb._id },
    {
      $set: {
        apprenant: {
          ...body.apprenant,
          historique_statut: effectifDb.apprenant.historique_statut,
        },
        updated_at: new Date(),
        // Ajout du computed
      },
    }
  );
};

const updateFormation = async (req, res) => {
  const effectifId = res.locals.effectifId;
  const effectifDb = await effectifsDb().findOne({ _id: effectifId });
  if (!effectifDb) {
    throw Boom.notFound(`Unable to find effectif ${effectifId.toString()}`);
  }
  const body: IEffectifCreationFormationSchema = req.body;

  const organismeLieuId = new ObjectId(body.organisme.organisme_lieu_id);
  const organismeFormationId = new ObjectId(body.organisme.organisme_formateur_id);
  const organismeResponsableId = new ObjectId(body.organisme.organisme_responsable_id);

  return await effectifsDb().updateOne(
    { _id: effectifDb._id },
    {
      $set: {
        annee_scolaire: body.annee_scolaire,
        formation: body.formation,
        organisme_id: organismeLieuId,
        organisme_responsable_id: organismeResponsableId,
        organisme_formateur_id: organismeFormationId,
        updated_at: new Date(),
        // Ajout du computed
      },
    }
  );
};

const updateContrats = async (req, res) => {
  const effectifId = res.locals.effectifId;
  const effectifDb = await effectifsDb().findOne({ _id: effectifId });
  if (!effectifDb) {
    throw Boom.notFound(`Unable to find effectif ${effectifId.toString()}`);
  }
  const body: IEffectifCreationContratsSchema = req.body;

  return await effectifsDb().updateOne(
    { _id: effectifDb._id },
    {
      $set: {
        contrats: body.contrats,
        updated_at: new Date(),
        // Ajout du computed
      },
    }
  );
};
