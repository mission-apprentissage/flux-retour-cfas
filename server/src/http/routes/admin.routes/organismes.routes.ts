import Boom from "boom";
import express from "express";
import { z } from "zod";

import {
  findOrganismeById,
  getAllOrganismes,
  getDetailedOrganismeById,
  updateOrganismeFromApis,
} from "@/common/actions/organismes/organismes.actions";
import objectIdSchema from "@/common/validation/objectIdSchema";
import organismesFilterSchema from "@/common/validation/organismesFilterSchema";
import paginationShema from "@/common/validation/paginationSchema";
import searchShema from "@/common/validation/searchSchema";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const listSchema = paginationShema({ defaultSort: "created_at:-1" })
  .merge(searchShema())
  .merge(organismesFilterSchema())
  .strict();
type ListSchema = z.infer<typeof listSchema>;

export default () => {
  const router = express.Router();

  router.get(
    "/",
    validateRequestMiddleware({
      query: listSchema,
    }),
    async (req, res) => {
      const { page, limit, sort, q, filter } = req.query as ListSchema;
      const query: any = filter || {};
      if (q) {
        query.$text = { $search: q };
      }

      const result = await getAllOrganismes(query, { page, limit, sort });
      if (result) {
        result.filter = filter;
      }
      return res.json(result);
    }
  );

  router.get(
    "/:id",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    async ({ params }, res) => {
      const { id } = params;
      const organisme = await getDetailedOrganismeById(id);
      if (!organisme) {
        throw Boom.notFound(`Organisme with id ${id} not found`);
      }

      res.json(organisme);
    }
  );

  router.get(
    "/:id/parametrage-transmission",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    async ({ params }, res) => {
      const { id } = params;

      const organisme = await findOrganismeById(id as string, {
        last_transmission_date: 1,
        erps: 1,
        api_key: 1,
        mode_de_transmission: 1,
        mode_de_transmission_configuration_date: 1,
        api_version: 1,
        organisme_transmetteur_id: 1,
      });

      if (!organisme) {
        throw Boom.notFound(`Organisme with id ${id} not found`);
      }

      let organismeTransmetteur;

      if (organisme.organisme_transmetteur_id) {
        organismeTransmetteur = await findOrganismeById(organisme.organisme_transmetteur_id);
      }

      res.json({
        transmission_date: organisme.last_transmission_date,
        transmission_api_active: organisme.mode_de_transmission === "API",
        transmission_api_version: organisme.api_version,
        transmission_manuelle_active: organisme.mode_de_transmission === "MANUEL",
        api_key_active: !!organisme.api_key,
        parametrage_erp_active: !!organisme.mode_de_transmission_configuration_date,
        parametrage_erp_date: organisme.mode_de_transmission_configuration_date,
        erps: organisme.erps,
        organisme_transmetteur_id: organisme.organisme_transmetteur_id,
        ...(organismeTransmetteur
          ? {
              organisme_transmetteur: {
                _id: organismeTransmetteur._id,
                enseigne: organismeTransmetteur.enseigne,
                raison_sociale: organismeTransmetteur.raison_sociale,
              },
            }
          : {}),
      });
    }
  );

  router.put(
    "/:id/hydrate",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    async ({ params }, res) => {
      const { id } = params;
      const organisme = await findOrganismeById(id as string);
      if (!organisme) {
        throw Boom.notFound(`Organisme with id ${id} not found`);
      }

      const updated = await updateOrganismeFromApis(organisme);

      res.json(updated);
    }
  );

  return router;
};
