import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import {
  IOrganisationMissionLocale,
  IUpdateMissionLocaleEffectif,
  updateMissionLocaleEffectifApi,
} from "shared/models";
import { BREVO_LISTE_TYPE } from "shared/models/data/brevoMissionLocaleList.model";
import { zStatsPeriod, type StatsPeriod } from "shared/models/data/nationalStats.model";
import { extensions } from "shared/models/parts/zodPrimitives";
import { effectifMissionLocaleListe } from "shared/models/routes/mission-locale/missionLocale.api";
import { z } from "zod";

import {
  activateMissionLocale,
  activateOrganisme,
  getAllMlFromOrganisations,
  getMissionsLocalesStatsAdmin,
  getMissionsLocalesStatsAdminById,
  getMlFromOrganisations,
  resetEffectifMissionLocaleDataAdmin,
  setEffectifMissionLocaleDataAdmin,
} from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import { getOrCreateBrevoList } from "@/common/actions/brevo/brevo.actions";
import {
  getAccompagnementConjointStats,
  getNationalStats,
} from "@/common/actions/mission-locale/mission-locale-stats.actions";
import {
  getAllEffectifsParMois,
  getEffectifFromMissionLocaleId,
  getEffectifMissionLocaleEligibleToBrevo,
  getEffectifMissionLocaleEligibleToBrevoCount,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { getMissionsLocales } from "@/common/apis/apiAlternance/apiAlternance";
import { organisationsDb, organismesDb } from "@/common/model/collections";
import { importContacts, removeAllContactFromList } from "@/common/services/brevo/brevo";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllMls));
  router.get(
    "/stats",
    validateRequestMiddleware({
      query: z.object({
        arml: z
          .array(
            z
              .string()
              .regex(/^[0-9a-f]{24}$/)
              .optional()
          )
          .optional()
          .default([]),
      }),
    }),
    returnResult(getAllMlsStats)
  );

  router.get(
    "/stats/national",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
      }),
    }),
    returnResult(getNationalStatsRoute)
  );

  router.get("/stats/accompagnement-conjoint", returnResult(getAccompagnementConjointStatsRoute));

  router.post(
    "/activate",
    validateRequestMiddleware({
      body: z.object({ date: z.coerce.date(), missionLocaleId: z.string().regex(/^[0-9a-f]{24}$/) }),
    }),
    returnResult(activateMLAtDate)
  );

  router.put(
    "/effectif",
    validateRequestMiddleware({
      body: z.object({
        ...updateMissionLocaleEffectifApi,
        mission_locale_id: extensions.objectIdString(),
        effectif_id: extensions.objectIdString(),
      }),
    }),
    returnResult(updateMissionLocaleEffectif)
  );

  router.post(
    "/effectif/reset",
    validateRequestMiddleware({
      body: z.object({
        mission_locale_id: extensions.objectIdString(),
        effectif_id: extensions.objectIdString(),
      }),
    }),
    returnResult(resetMissionLocaleEffectif)
  );

  router.post(
    "/organismes/activate",
    validateRequestMiddleware({
      body: z.object({
        date: z.coerce.date(),
        organismes_ids_list: z.array(extensions.objectIdString()),
      }),
    }),
    returnResult(activateOrganismeAtDate)
  );

  router.get("/:id", returnResult(getMl));
  router.get(
    "/:id/stats",
    validateRequestMiddleware({
      query: z.object({
        rqth_only: z.enum(["true", "false"]).optional(),
        mineur_only: z.enum(["true", "false"]).optional(),
      }),
    }),
    returnResult(getMlStats)
  );
  router.get("/:id/effectifs-per-month", returnResult(getEffectifsParMoisMissionLocale));
  router.get("/:id/effectif/:effectiId", returnResult(getEffectifMissionLocale));
  router.get("/:id/brevo/sync", returnResult(getSyncBrevoContactInfo));
  router.post("/:id/brevo/sync", returnResult(syncBrevoContactMissionLocale));

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

const getAllMlsStats = async ({ query }) => {
  const { arml }: { arml: Array<string> } = query;
  const mls = await getMissionsLocalesStatsAdmin(arml);
  return mls;
};

const getMl = async (req) => {
  const id = req.params.id;
  const organisationMl = await getMlFromOrganisations(id);
  if (!organisationMl) {
    throw Boom.notFound(`No Mission Locale found for id: ${id}`);
  }
  return organisationMl;
};

const getMlStats = async ({ params, query }) => {
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

export const getEffectifsParMoisMissionLocale = async (req) => {
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

const getEffectifMissionLocale = async (req) => {
  const { nom_liste } = await validateFullZodObjectSchema(req.query, effectifMissionLocaleListe);
  const mlId = req.params.id;
  const effectifId = req.params.effectiId;

  const missionLocale = (await organisationsDb().findOne({ _id: new ObjectId(mlId) })) as IOrganisationMissionLocale;
  if (!missionLocale) {
    throw Boom.notFound(`No Mission Locale found for id: ${mlId}`);
  }

  return await getEffectifFromMissionLocaleId(missionLocale, effectifId, nom_liste);
};

const updateMissionLocaleEffectif = async (req) => {
  const { mission_locale_id, effectif_id, ...rest } = req.body;
  return await setEffectifMissionLocaleDataAdmin(
    new ObjectId(mission_locale_id),
    new ObjectId(effectif_id),
    rest as IUpdateMissionLocaleEffectif,
    req.user
  );
};

const resetMissionLocaleEffectif = async (req) => {
  const { mission_locale_id, effectif_id } = req.body;

  return resetEffectifMissionLocaleDataAdmin(new ObjectId(mission_locale_id), new ObjectId(effectif_id), req.user);
};

const activateMLAtDate = ({ body }) => {
  const { date, missionLocaleId } = body;
  return activateMissionLocale(missionLocaleId, date);
};

const getSyncBrevoContactInfo = async (req) => {
  const id = req.params.id;
  const organisationMl = await getMlFromOrganisations(id);
  if (!organisationMl) {
    throw Boom.notFound(`No Mission Locale found for id: ${id}`);
  }
  return getEffectifMissionLocaleEligibleToBrevoCount(organisationMl);
};

const syncBrevoContactMissionLocale = async (req) => {
  const id = req.params.id;
  const organisationMl = await getMlFromOrganisations(id);
  if (!organisationMl) {
    throw Boom.notFound(`No Mission Locale found for id: ${id}`);
  }

  const getMissionLocaleEffectif = await getEffectifMissionLocaleEligibleToBrevo(organisationMl);
  const listId = await getOrCreateBrevoList(organisationMl.ml_id, organisationMl?.nom, BREVO_LISTE_TYPE.MISSION_LOCALE);

  if (!listId) {
    throw Boom.notFound(`Error while creating Brevo list for id: ${id}`);
  }

  await removeAllContactFromList(listId);
  await importContacts(listId, getMissionLocaleEffectif);
};

export const activateOrganismeAtDate = async (req) => {
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

const getNationalStatsRoute = async (req) => {
  const { period } = req.query;
  return await getNationalStats(period as StatsPeriod | undefined);
};

const getAccompagnementConjointStatsRoute = async () => {
  return await getAccompagnementConjointStats();
};
