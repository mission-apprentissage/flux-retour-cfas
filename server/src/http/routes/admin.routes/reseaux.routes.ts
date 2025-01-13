import Boom from "boom";
import express from "express";

import { getReseauById } from "@/common/actions/reseaux/reseaux.actions";
import { reseauxDb } from "@/common/model/collections";
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
      const reseau = await getReseauById(id as string);
      if (!reseau) {
        throw Boom.notFound(`Reseau with id ${id} not found`);
      }

      res.json(reseau);
    }
  );

  // router.put(
  //   "/:id/reseaux",
  //   validateRequestMiddleware({
  //     params: objectIdSchema("id"),
  //     body: z.object({
  //       reseaux: z.array(z.string()).nonempty("The reseaux field must be a non-empty array"),
  //     }),
  //   }),
  //   async (req, res) => {
  //     const { id } = req.params;
  //     const { reseaux } = req.body as {
  //       reseaux: (
  //         | "ADEN"
  //         | "CMA"
  //         | "AGRI"
  //         | "AGRI_CNEAP"
  //         | "AGRI_UNREP"
  //         | "AGRI_UNMFREO"
  //         | "ANASUP"
  //         | "AMUE"
  //         | "CCI"
  //         | "CFA_EC"
  //         | "COMP_DU_DEVOIR"
  //         | "COMP_DU_TOUR_DE_FRANCE"
  //         | "GRETA"
  //         | "UIMM"
  //         | "AFPA"
  //         | "AFTRAL"
  //       )[];
  //     };

  //     const objectId = new ObjectId(id as string);

  //     const organisme = await findOrganismeById(objectId);
  //     if (!organisme) {
  //       throw Boom.notFound(`Organisme with id ${id} not found`);
  //     }

  //     const updatedOrganisme = await organismesDb().findOneAndUpdate(
  //       { _id: objectId },
  //       { $set: { reseaux, updated_at: new Date() } },
  //       { returnDocument: "after" }
  //     );

  //     if (!updatedOrganisme.value) {
  //       throw Boom.badImplementation("Failed to update reseaux");
  //     }

  //     res.json(updatedOrganisme.value);
  //   }
  // );

  return router;
};

export const getAllReseaux = async () => {
  return reseauxDb().find().toArray();
};
