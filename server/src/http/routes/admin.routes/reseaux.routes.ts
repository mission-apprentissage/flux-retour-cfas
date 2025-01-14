import Boom from "boom";
import express from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { getReseauById } from "@/common/actions/reseaux/reseaux.actions";
import { organismesDb, reseauxDb } from "@/common/model/collections";
import objectIdSchema from "@/common/validation/objectIdSchema";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllReseaux));

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
      const { organismeId } = body;

      if (!organismeId) {
        throw Boom.badRequest("organismeId is required in the request body");
      }

      let organismeObjectId;
      try {
        organismeObjectId = new ObjectId(organismeId);
      } catch (error) {
        throw Boom.badRequest("Invalid organismeId format. Must be a valid ObjectId.");
      }

      const reseau = await getReseauById(id as string);
      if (!reseau) {
        throw Boom.notFound(`Reseau with id ${id} not found`);
      }

      const result = await reseauxDb().findOneAndUpdate(
        { _id: new ObjectId(id as string) },
        {
          $push: { organismes_ids: organismeObjectId },
        },
        { returnDocument: "after" }
      );

      if (!result.value) {
        throw Boom.internal("Failed to update the organismes_ids array.");
      }

      res.json(result.value);
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
        const result = await reseauxDb().findOneAndUpdate(
          { _id: new ObjectId(id as string) },
          {
            $pull: { organismes_ids: organismeId as ObjectId },
          },
          { returnDocument: "after" }
        );

        console.log("CONSOLE LOG ~ result:", result);
        if (!result.value) {
          throw Boom.notFound(`No reseau found with id ${id}`);
        }

        res.json(result.value);
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
  return reseauxDb().find().sort({ nom: 1 }).toArray();
};
