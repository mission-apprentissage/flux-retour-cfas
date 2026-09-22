import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import {
  IOrganisationMissionLocale,
  IUpdateMissionLocaleEffectif,
  updateMissionLocaleEffectifApi,
} from "shared/models";
import { httpUrlSchema } from "shared/models/data/organisations.model";
import { extensions } from "shared/models/parts/zodPrimitives";
import { effectifMissionLocaleListe } from "shared/models/routes/mission-locale/missionLocale.api";
import { z } from "zod";

import {
  activateMissionLocale,
  activateOrganisme,
  getAllMlFromOrganisations,
  getMissionLocaleDetail,
  getMissionLocaleMembers,
  getMissionsLocalesStatsAdmin,
  getMissionsLocalesStatsAdminById,
  getMlFromOrganisations,
  resetEffectifMissionLocaleDataAdmin,
  setEffectifMissionLocaleDataAdmin,
} from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import {
  getAllEffectifsParMois,
  getEffectifFromMissionLocaleId,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { getMissionsLocales } from "@/common/apis/apiAlternance/apiAlternance";
import { organisationsDb, organismesDb } from "@/common/model/collections";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { DefaultParams, DefaultQuery, returnResult, RouteHandler } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const mlIdSchema = z.string().regex(/^[0-9a-f]{24}$/);
const statsAdminQuery = z.object({ arml: z.array(mlIdSchema).optional().default([]) });
const activateBody = z.object({ date: z.coerce.date(), missionLocaleId: mlIdSchema });
const updateEffectifBody = z.object({
  ...updateMissionLocaleEffectifApi,
  mission_locale_id: extensions.objectIdString(),
  effectif_id: extensions.objectIdString(),
});
const resetEffectifBody = z.object({
  mission_locale_id: extensions.objectIdString(),
  effectif_id: extensions.objectIdString(),
});
const activateOrganismesBody = z.object({
  date: z.coerce.date(),
  organismes_ids_list: z.array(extensions.objectIdString()),
});
const mlIdParams = z.object({ id: mlIdSchema });
const parametresBody = z.object({ rdv_url: httpUrlSchema.nullable() });
const mlStatsQuery = z.object({
  rqth_only: z.enum(["true", "false"]).optional(),
  mineur_only: z.enum(["true", "false"]).optional(),
});

type AdminHandler<TQuery = DefaultQuery, TParams = DefaultParams, TBody = unknown> = RouteHandler<
  Record<string, unknown>,
  TParams,
  TQuery,
  TBody
>;

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllMls));
  router.get("/stats", validateRequestMiddleware({ query: statsAdminQuery }), returnResult(getAllMlsStats));
  router.post("/activate", validateRequestMiddleware({ body: activateBody }), returnResult(activateMLAtDate));
  router.put(
    "/effectif",
    validateRequestMiddleware({ body: updateEffectifBody }),
    returnResult(updateMissionLocaleEffectif)
  );
  router.post(
    "/effectif/reset",
    validateRequestMiddleware({ body: resetEffectifBody }),
    returnResult(resetMissionLocaleEffectif)
  );
  router.post(
    "/organismes/activate",
    validateRequestMiddleware({ body: activateOrganismesBody }),
    returnResult(activateOrganismeAtDate)
  );

  router.get("/:id", returnResult(getMl));
  router.get("/:id/detail", returnResult(getMlDetail));
  router.get("/:id/membres", returnResult(getMlMembres));
  router.put(
    "/:id/parametres",
    validateRequestMiddleware({ params: mlIdParams, body: parametresBody }),
    returnResult(updateMlParametresAdmin)
  );
  router.get("/:id/stats", validateRequestMiddleware({ query: mlStatsQuery }), returnResult(getMlStats));
  router.get("/:id/effectifs-per-month", returnResult(getEffectifsParMoisMissionLocale));
  router.get("/:id/effectif/:effectiId", returnResult(getEffectifMissionLocale));

  return router;
};

const getAllMls = async () => {
  const externalML = await getMissionsLocales();
  if (!externalML) {
    throw Boom.notFound("Aucune mission locale trouvée");
  }
  const organisationMl = await getAllMlFromOrganisations();

  return organisationMl
    .map((orga) => ({ organisation: orga, externalML: externalML.find((ml) => ml.id === orga.ml_id) }))
    .filter((ml) => ml.externalML);
};

const getAllMlsStats: AdminHandler<z.infer<typeof statsAdminQuery>> = async ({ query }) => {
  const { arml } = query;
  const mls = await getMissionsLocalesStatsAdmin(arml);
  return mls;
};

const getMl: AdminHandler = async (req) => {
  const id = req.params.id;
  const organisationMl = await getMlFromOrganisations(id);
  if (!organisationMl) {
    throw Boom.notFound(`No Mission Locale found for id: ${id}`);
  }
  return organisationMl;
};

const getMlStats: AdminHandler<z.infer<typeof mlStatsQuery>> = async ({ params, query }) => {
  const id = params.id;
  const organisationMl = await getMlFromOrganisations(id);
  if (!organisationMl) {
    throw Boom.notFound(`No Mission Locale found for id: ${id}`);
  }
  const rqth_only = query.rqth_only === "true";
  const mineur_only = query.mineur_only === "true";

  const ml = await getMissionsLocalesStatsAdminById(organisationMl, mineur_only, rqth_only);
  return {
    ...organisationMl,
    stats: ml,
  };
};

export const getEffectifsParMoisMissionLocale: AdminHandler = async (req) => {
  const id = req.params.id;
  if (!id) {
    throw Boom.badRequest("Missing id");
  }

  const missionLocale = (await organisationsDb().findOne({ _id: new ObjectId(id) })) as IOrganisationMissionLocale;
  if (!missionLocale) {
    throw Boom.notFound(`No Mission Locale found for id: ${id}`);
  }

  return await getAllEffectifsParMois(missionLocale);
};

const getEffectifMissionLocale: AdminHandler = async (req) => {
  const { nom_liste } = await validateFullZodObjectSchema(req.query, effectifMissionLocaleListe);
  const mlId = req.params.id;
  const effectifId = req.params.effectiId;

  const missionLocale = (await organisationsDb().findOne({ _id: new ObjectId(mlId) })) as IOrganisationMissionLocale;
  if (!missionLocale) {
    throw Boom.notFound(`No Mission Locale found for id: ${mlId}`);
  }

  return await getEffectifFromMissionLocaleId(missionLocale, effectifId, nom_liste);
};

const updateMissionLocaleEffectif: AdminHandler<
  DefaultQuery,
  DefaultParams,
  z.infer<typeof updateEffectifBody>
> = async (req) => {
  const { mission_locale_id, effectif_id, ...rest } = req.body;
  return await setEffectifMissionLocaleDataAdmin(
    new ObjectId(mission_locale_id),
    new ObjectId(effectif_id),
    rest as IUpdateMissionLocaleEffectif,
    req.user
  );
};

const resetMissionLocaleEffectif: AdminHandler<DefaultQuery, DefaultParams, z.infer<typeof resetEffectifBody>> = async (
  req
) => {
  const { mission_locale_id, effectif_id } = req.body;

  return resetEffectifMissionLocaleDataAdmin(new ObjectId(mission_locale_id), new ObjectId(effectif_id), req.user);
};

const activateMLAtDate: AdminHandler<DefaultQuery, DefaultParams, z.infer<typeof activateBody>> = ({ body }) => {
  const { date, missionLocaleId } = body;
  return activateMissionLocale(new ObjectId(missionLocaleId), date);
};

export const activateOrganismeAtDate: AdminHandler<
  DefaultQuery,
  DefaultParams,
  z.infer<typeof activateOrganismesBody>
> = async (req) => {
  const { date, organismes_ids_list } = req.body;

  const organismes = await organismesDb()
    .find({
      _id: { $in: organismes_ids_list.map((id) => new ObjectId(id)) },
    })
    .toArray();

  if (!organismes.length) {
    throw Boom.notFound(`No Organisations found for ids: ${organismes_ids_list.join(", ")}`);
  }

  for (const organisme of organismes) {
    await activateOrganisme(new Date(date), organisme._id);
  }
};

const getMlDetail: AdminHandler = async (req) => {
  const id = req.params.id;
  return getMissionLocaleDetail(new ObjectId(id));
};

/**
 * Met à jour les paramètres ML côté admin.
 * Mirror de la route user `PUT /api/v1/organisation/mission-locale/parametres` (§8.1).
 */
const updateMlParametresAdmin: AdminHandler<
  DefaultQuery,
  z.infer<typeof mlIdParams>,
  z.infer<typeof parametresBody>
> = async (req) => {
  const id = req.params.id;
  const { rdv_url } = req.body;

  const result = await organisationsDb().updateOne(
    { _id: new ObjectId(id), type: "MISSION_LOCALE" },
    { $set: { rdv_url } }
  );

  if (result.matchedCount === 0) {
    throw Boom.notFound(`No Mission Locale found for id: ${id}`);
  }

  return { rdv_url };
};

const getMlMembres: AdminHandler = async (req) => {
  const id = req.params.id;
  const organisationMl = await getMlFromOrganisations(id);
  if (!organisationMl) {
    throw Boom.notFound(`No Mission Locale found for id: ${id}`);
  }
  return getMissionLocaleMembers(new ObjectId(id));
};
