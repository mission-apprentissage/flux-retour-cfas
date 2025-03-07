import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import xlsx from "node-xlsx";
import { IEffectif, IOrganisationMissionLocale } from "shared/models";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import {
  effectifsFiltersMissionLocaleSchema,
  effectifsParMoisFiltersMissionLocaleSchema,
} from "shared/models/routes/mission-locale/missionLocale.api";
import { withPaginationSchema } from "shared/models/routes/pagination";

import { dateFiltersSchema } from "@/common/actions/helpers/filters";
import {
  getEffectifFromMissionLocaleId,
  getEffectifIndicateursForMissionLocaleId,
  getEffectifsListByMisisonLocaleId,
  getEffectifsParMoisByMissionLocaleId,
  getPaginatedEffectifsByMissionLocaleId,
  getPaginatedOrganismesByMissionLocaleId,
  setEffectifMissionLocaleData,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { createTelechargementListeNomLog } from "@/common/actions/telechargementListeNomLogs.actions";
import { updateMissionLocaleEffectifApi } from "@/common/apis/missions-locale/mission-locale.api";
import { effectifsDb, effectifsDECADb } from "@/common/model/collections";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { formatJsonToXlsx } from "@/common/utils/xlsxUtils";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();
  router.get("/indicateurs", returnResult(getIndicateursMissionLocale));
  router.get("/effectifs", returnResult(getEffectifsMissionLocale));
  router.get("/effectif/:id", returnResult(getEffectifMissionLocale));
  router.get("/effectifs-per-month", returnResult(getEffectifsParMoisMissionLocale));
  router.get("/export/effectifs", returnResult(exportEffectifMissionLocale));
  router.get("/organismes", returnResult(getOrganismesMissionLocale));
  router.post("/effectif", returnResult(updateEffectifMissionLocaleData));
  return router;
};

const getIndicateursMissionLocale = async (req, { locals }) => {
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  const filters = await validateFullZodObjectSchema(req.query, dateFiltersSchema);
  return await getEffectifIndicateursForMissionLocaleId(filters, missionLocale.ml_id);
};

const getEffectifsMissionLocale = async ({ query }, { locals }) => {
  const filters = await validateFullZodObjectSchema(query, withPaginationSchema(effectifsFiltersMissionLocaleSchema));
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  return await getPaginatedEffectifsByMissionLocaleId(missionLocale.ml_id, missionLocale._id, filters);
};

const updateEffectifMissionLocaleData = async ({ body }, { locals }) => {
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  const data = await validateFullZodObjectSchema(body, updateMissionLocaleEffectifApi);

  let effectif: IEffectif | IEffectifDECA | null = await effectifsDb().findOne({ _id: new ObjectId(data.effectif_id) });

  if (!effectif) {
    effectif = await effectifsDECADb().findOne({ _id: new ObjectId(data.effectif_id) });
  }

  if (!effectif) {
    throw Boom.notFound("Effectif introuvable");
  }
  if (effectif.apprenant.adresse?.mission_locale_id?.toString() !== missionLocale.ml_id.toString()) {
    throw Boom.forbidden("Accès non autorisé");
  }
  return await setEffectifMissionLocaleData(missionLocale._id, data);
};

const getOrganismesMissionLocale = async (req, { locals }) => {
  const filters = await validateFullZodObjectSchema(req.query, withPaginationSchema({}));
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  return await getPaginatedOrganismesByMissionLocaleId(missionLocale.ml_id, filters);
};

const getEffectifsParMoisMissionLocale = async ({ query }, { locals }) => {
  const filters = await validateFullZodObjectSchema(query, effectifsParMoisFiltersMissionLocaleSchema);
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  return await getEffectifsParMoisByMissionLocaleId(missionLocale.ml_id, missionLocale._id, filters);
};

const getEffectifMissionLocale = async ({ params }, { locals }) => {
  const effectifId = params.id;
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;

  return await getEffectifFromMissionLocaleId(missionLocale.ml_id, missionLocale._id, effectifId);
};

const exportEffectifMissionLocale = async (req, res) => {
  const missionLocale = res.locals.missionLocale as IOrganisationMissionLocale;

  const effectifList = await getEffectifsListByMisisonLocaleId(missionLocale.ml_id, missionLocale._id);

  const worksheet = xlsx.build([
    { name: "Liste des jeunes à traiter", data: formatJsonToXlsx(effectifList, ["nom", "prenom"]), options: {} },
  ]);
  res.attachment(`rupturants_a_traiter-${new Date().toISOString().split("T")[0]}.xlsx`);
  res.contentType("xlsx");
  await createTelechargementListeNomLog(
    "ml_a_traiter",
    effectifList.map(({ _id }) => _id.toString()),
    new Date(),
    req.user?._id,
    undefined,
    missionLocale._id
  );

  return worksheet;
};
