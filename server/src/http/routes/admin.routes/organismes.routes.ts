import Boom from "boom";
import express from "express";
import { SIRET_REGEX, UAI_REGEX } from "shared/constants/validations";
import { z } from "zod";

import { checkCollabV2Eligibility } from "@/common/actions/organismes/collab-v2-eligibility";
import { checkActivationEligibility } from "@/common/actions/organismes/deca-cfa-eligibility";
import { findOrganismeById, getAllOrganismes } from "@/common/actions/organismes/organismes.actions";
import {
  activateCollabV2,
  activateDecaCfaPilotBatch,
  deactivateCollabV2,
  deactivateDecaCfaPilotBatch,
  getArchivableOrganismes,
  searchOrganismesSupportInfoBySiret,
} from "@/common/actions/organismes/organismes.admin.actions";
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

const decaCfaPilotBatchSchema = z.object({
  items: z
    .array(
      z.object({
        siret: z.string().regex(SIRET_REGEX, "SIRET invalide (14 chiffres attendus)"),
        uai: z.string().regex(UAI_REGEX, "UAI invalide (7 chiffres + 1 lettre)"),
      })
    )
    .min(1)
    .max(100),
});

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
    "/search/:q",
    validateRequestMiddleware({
      params: z.object({ q: z.string().min(3) }),
    }),
    async ({ params }, res) => {
      const { q } = params;

      res.json(await searchOrganismesSupportInfoBySiret(q));
    }
  );

  router.get("/archivables", async (_req, res) => {
    res.json(await getArchivableOrganismes());
  });

  router.get(
    "/:id/deca-cfa-pilot-eligibility",
    validateRequestMiddleware({
      params: z.object({ id: z.string().regex(/^[0-9a-f]{24}$/) }),
    }),
    async ({ params }, res) => {
      const result = await checkActivationEligibility(params.id);
      res.json(result);
    }
  );

  router.post(
    "/deca-cfa-pilot/activate",
    validateRequestMiddleware({ body: decaCfaPilotBatchSchema }),
    async (req, res) => {
      const { items } = req.body as z.infer<typeof decaCfaPilotBatchSchema>;
      const result = await activateDecaCfaPilotBatch(items, req.user._id.toString());
      res.json(result);
    }
  );

  router.post(
    "/deca-cfa-pilot/deactivate",
    validateRequestMiddleware({ body: decaCfaPilotBatchSchema }),
    async (req, res) => {
      const { items } = req.body as z.infer<typeof decaCfaPilotBatchSchema>;
      const result = await deactivateDecaCfaPilotBatch(items, req.user._id.toString());
      res.json(result);
    }
  );

  router.get(
    "/:id/collab-v2-eligibility",
    validateRequestMiddleware({
      params: z.object({ id: z.string().regex(/^[0-9a-f]{24}$/) }),
    }),
    async ({ params }, res) => {
      const result = await checkCollabV2Eligibility(params.id);
      res.json(result);
    }
  );

  router.post(
    "/:id/collab-v2/activate",
    validateRequestMiddleware({
      params: z.object({ id: z.string().regex(/^[0-9a-f]{24}$/) }),
    }),
    async (req, res) => {
      const result = await activateCollabV2(req.params.id, req.user._id.toString());
      res.json(result);
    }
  );

  router.post(
    "/:id/collab-v2/deactivate",
    validateRequestMiddleware({
      params: z.object({ id: z.string().regex(/^[0-9a-f]{24}$/) }),
    }),
    async (req, res) => {
      const result = await deactivateCollabV2(req.params.id, req.user._id.toString());
      res.json(result);
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
        mode_de_transmission_configuration_author_fullname: 1,
        erp_unsupported: 1,
        api_version: 1,
        organisme_transmetteur_id: 1,
        last_erp_transmission_date: 1,
        api_key_revoked_at: 1,
        api_key_revoked_reason: 1,
      });

      if (!organisme) {
        throw Boom.notFound(`Organisme with id ${id} not found`);
      }

      let organismeTransmetteur;

      if (organisme.organisme_transmetteur_id) {
        organismeTransmetteur = await findOrganismeById(organisme.organisme_transmetteur_id);
      }

      res.json({
        transmission_date: organisme.last_erp_transmission_date,
        transmission_api_active: organisme.mode_de_transmission === "API",
        transmission_api_version: organisme.api_version,
        transmission_manuelle_active: organisme.mode_de_transmission === "MANUEL",
        api_key_active: !!organisme.api_key,
        api_key: organisme.mode_de_transmission === "API" ? organisme.api_key : undefined,
        api_key_revoked_at: organisme.api_key_revoked_at,
        api_key_revoked_reason: organisme.api_key_revoked_reason,
        parametrage_erp_active: !!organisme.mode_de_transmission_configuration_date,
        parametrage_erp_date: organisme.mode_de_transmission_configuration_date,
        parametrage_erp_author: organisme.mode_de_transmission_configuration_author_fullname,
        erps: organisme.erps,
        erp_unsupported: organisme.erp_unsupported,
        organisme_transmetteur_id: organisme.organisme_transmetteur_id,
        ...(organismeTransmetteur
          ? {
              organisme_transmetteur: {
                _id: organismeTransmetteur._id,
                enseigne: organismeTransmetteur.enseigne,
                raison_sociale: organismeTransmetteur.raison_sociale,
                uai: organismeTransmetteur.uai,
                siret: organismeTransmetteur.siret,
              },
            }
          : {}),
      });
    }
  );

  return router;
};
