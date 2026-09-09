import Boom from "boom";
import express from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { getReseauById } from "@/common/actions/reseaux/reseaux.actions";
import { organismesDb, reseauxDb } from "@/common/model/collections";
import objectIdSchema from "@/common/validation/objectIdSchema";
import { DefaultParams, DefaultQuery, returnResult, RouteHandler } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";
import { updateComputedFieldForOrganisme } from "@/jobs/computed/update-computed";

const reseauBody = z.object({
  nom: z.string(),
  responsable: z.boolean(),
});

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllReseaux));
  router.post("/", validateRequestMiddleware({ body: reseauBody }), returnResult(createReseau));
  router.get(
    "/:id",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    async ({ params }, res) => {
      const { id } = params;

      try {
        const result = await reseauxDb()
          .aggregate([
            {
              $match: { _id: id },
            },
            {
              $lookup: {
                from: "organismes",
                localField: "organismes_ids",
                foreignField: "_id",
                as: "organismes",
              },
            },
          ])
          .toArray();

        if (result.length === 0) {
          throw Boom.notFound(`Reseau with id ${id} not found`);
        }

        res.json(result[0]);
      } catch (error) {
        console.error("Error fetching reseau with organismes:", error);
        throw Boom.internal("Failed to fetch reseau with organismes.");
      }
    }
  );

  router.put(
    "/:id",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    async ({ params, body }, res) => {
      const { id } = params;
      const { organismeId } = body as { organismeId?: unknown };

      if (typeof organismeId !== "string" || !organismeId) {
        throw Boom.badRequest("organismeId is required in the request body");
      }

      let organismeObjectId;
      try {
        organismeObjectId = new ObjectId(organismeId);
      } catch (error) {
        throw Boom.badRequest("Invalid organismeId format. Must be a valid ObjectId.");
      }

      const reseau = await getReseauById(id);
      if (!reseau) {
        throw Boom.notFound(`Reseau with id ${id} not found`);
      }

      const result = await reseauxDb().findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $push: { organismes_ids: organismeObjectId },
        },
        { returnDocument: "after" }
      );

      if (!result) {
        throw Boom.internal("Failed to update the organismes_ids array.");
      }

      await organismesDb().updateOne({ _id: organismeObjectId }, { $addToSet: { reseaux: reseau.key } });

      const updatedOrganisme = await organismesDb().findOne({ _id: organismeObjectId });
      if (updatedOrganisme) {
        await updateComputedFieldForOrganisme(updatedOrganisme);
      }

      res.json(result);
    }
  );

  router.delete(
    "/:id/organismes/:organismeId",
    validateRequestMiddleware({
      params: z.object({
        id: z.preprocess(
          (value) => (typeof value === "string" && ObjectId.isValid(value) ? new ObjectId(value) : value),
          z.instanceof(ObjectId)
        ),
        organismeId: z.preprocess(
          (value) => (typeof value === "string" && ObjectId.isValid(value) ? new ObjectId(value) : value),
          z.instanceof(ObjectId)
        ),
      }),
    }),
    async ({ params }, res) => {
      const { id, organismeId } = params;

      try {
        const reseau = await getReseauById(id);
        if (!reseau) {
          throw Boom.notFound(`Reseau with id ${id} not found`);
        }

        const result = await reseauxDb().findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $pull: { organismes_ids: organismeId } },
          { returnDocument: "after" }
        );

        if (!result) {
          throw Boom.notFound(`No reseau found with id ${id}`);
        }

        await organismesDb().updateOne({ _id: organismeId as ObjectId }, { $pull: { reseaux: reseau.key } });

        const updatedOrganisme = await organismesDb().findOne({ _id: organismeId as ObjectId });
        if (updatedOrganisme) {
          await updateComputedFieldForOrganisme(updatedOrganisme);
        }

        res.json(result);
      } catch (error) {
        console.error("Error during deletion:", error);
        throw Boom.internal("Failed to remove organismeId from reseau.");
      }
    }
  );

  router.get(
    "/organismes/search/:q",
    validateRequestMiddleware({
      params: z.object({ q: z.string().min(3) }),
    }),
    async ({ params }, res) => {
      const { q } = params;

      res.json(
        await organismesDb()
          .find({ $text: { $search: q } })
          .sort({ nom: 1 })
          .toArray()
      );
    }
  );

  return router;
};

export const getAllReseaux = async () => {
  return reseauxDb()
    .aggregate([
      { $sort: { nom: 1 } },
      {
        $lookup: {
          from: "organismes",
          localField: "organismes_ids",
          foreignField: "_id",
          as: "organismes",
          pipeline: [{ $project: { _id: 1 } }],
        },
      },
      { $addFields: { organismes_count: { $size: "$organismes" } } },
      { $project: { organismes: 0 } },
    ])
    .toArray();
};

export const createReseau: RouteHandler<
  Record<string, unknown>,
  DefaultParams,
  DefaultQuery,
  z.infer<typeof reseauBody>
> = async ({ body }) => {
  const { nom, responsable } = body;
  const key = nom.toUpperCase().replace(/ /g, "_");

  const date = new Date();

  return await reseauxDb().insertOne({
    _id: new ObjectId(),
    key,
    nom,
    responsable,
    organismes_ids: [],
    created_at: date,
    updated_at: date,
  });
};
