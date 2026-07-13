import Boom from "boom";
import { ObjectId } from "bson";
import ExcelJs from "exceljs";
import express from "express";
import { CFA_SUIVI_CATEGORY, zDeclareCfaRuptureApi } from "shared/models/routes/organismes/cfa";
import { z } from "zod";

import { getCfaEffectifsEnRupture } from "@/common/actions/cfa/cfa-effectifs-ruptures.actions";
import {
  declareCfaEffectifRupture,
  getCfaEffectifDetail,
  getCfaEffectifs,
} from "@/common/actions/cfa/cfa-effectifs.actions";
import {
  getCfaSuiviMissionLocale,
  getCfaSuiviMissionLocaleExportRows,
} from "@/common/actions/cfa/cfa-suivi-mission-locale.actions";
import { getOrganisationOrganismeByOrganismeId } from "@/common/actions/organisations.actions";
import { missionLocaleEffectifsDb, organismesDb } from "@/common/model/collections";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { formatJsonToXlsx } from "@/common/utils/xlsxUtils";
import { returnResult } from "@/http/middlewares/helpers";

const zCfaEffectifsQuery = {
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(100),
  search: z.string().optional(),
  sort: z.enum(["nom", "formation", "date_rupture", "en_rupture", "collab_status", "last_activity"]).default("nom"),
  order: z.enum(["asc", "desc"]).default("asc"),
  en_rupture: z.enum(["oui", "non"]).optional(),
  collab_status: z.string().optional(),
  formation: z.string().optional(),
};

const zCfaRupturesQuery = {
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(100),
  search: z.string().optional(),
  sort: z.enum(["nom", "formation", "date_rupture", "collab_status"]).default("date_rupture"),
  order: z.enum(["asc", "desc"]).default("desc"),
  collab_status: z.string().optional(),
  formation: z.string().optional(),
};

const zCfaSuiviMissionLocaleQuery = {
  category: z
    .enum([CFA_SUIVI_CATEGORY.COLLAB, CFA_SUIVI_CATEGORY.HORS_COLLAB, CFA_SUIVI_CATEGORY.TOUS])
    .default(CFA_SUIVI_CATEGORY.COLLAB),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(100),
  search: z.string().optional(),
  sort: z.enum(["nom", "formation", "date_rupture", "collab_status"]).default("date_rupture"),
  order: z.enum(["asc", "desc"]).default("desc"),
  collab_status: z.string().optional(),
  formation: z.string().optional(),
};

const zDeclareRuptureBody = zDeclareCfaRuptureApi.shape;

async function getOrganismeWithDeca(locals: { organismeId: string }) {
  const organismeObjectId = new ObjectId(locals.organismeId);
  const organisme = await getOrganisationOrganismeByOrganismeId(organismeObjectId);
  if (!organisme) {
    throw Boom.notFound("No organisme found for the provided ID");
  }
  if (organisme.type !== "ORGANISME_FORMATION") {
    throw Boom.forbidden("This endpoint is only available for CFA organisations");
  }
  if (!organisme.organisme_id) {
    throw Boom.badData("Organisation has no organisme_id");
  }

  const organismeId = new ObjectId(organisme.organisme_id);

  const organismeDoc = await organismesDb().findOne({ _id: organismeId }, { projection: { is_allowed_deca: 1 } });

  return { organisme, organismeId, isAllowedDeca: organismeDoc?.is_allowed_deca ?? false };
}

async function getCfaEffectifsRuptureHandler({ query }, { locals }) {
  const { organisme, isAllowedDeca } = await getOrganismeWithDeca(locals);
  const params = await validateFullZodObjectSchema(query, zCfaRupturesQuery);
  return await getCfaEffectifsEnRupture(organisme, isAllowedDeca, params);
}

export default () => {
  const router = express.Router();

  router.get("/effectifs-ruptures", returnResult(getCfaEffectifsRuptureHandler));

  router.get(
    "/unread-notifications-count",
    returnResult(async (_req, { locals }) => {
      const { organismeId } = await getOrganismeWithDeca(locals);
      const count = await missionLocaleEffectifsDb().countDocuments({
        "effectif_snapshot.organisme_id": organismeId,
        "organisme_data.has_unread_notification": true,
        soft_deleted: { $ne: true },
      });
      return { count };
    })
  );

  router.get(
    "/effectifs",
    returnResult(async ({ query }, { locals }) => {
      const { organisme, isAllowedDeca } = await getOrganismeWithDeca(locals);
      const params = await validateFullZodObjectSchema(query, zCfaEffectifsQuery);
      return await getCfaEffectifs(organisme, isAllowedDeca, params);
    })
  );

  router.get(
    "/suivi-mission-locale",
    returnResult(async ({ query }, { locals }) => {
      const { organisme, isAllowedDeca } = await getOrganismeWithDeca(locals);
      const params = await validateFullZodObjectSchema(query, zCfaSuiviMissionLocaleQuery);
      return await getCfaSuiviMissionLocale(organisme, isAllowedDeca, params);
    })
  );

  router.get("/suivi-mission-locale/export", async (_req, res, next) => {
    try {
      const { organisme, isAllowedDeca } = await getOrganismeWithDeca(res.locals as { organismeId: string });
      const rows = await getCfaSuiviMissionLocaleExportRows(organisme, isAllowedDeca);

      const columns = [
        { name: "Prénom", id: "prenom" },
        { name: "Nom", id: "nom" },
        { name: "En rupture", id: "en_rupture" },
        { name: "Intitulé de la formation", id: "libelle_formation" },
        { name: "Date de rupture", id: "date_rupture", transform: (d: Date | null) => (d ? new Date(d) : "") },
        { name: "Statut de collaboration avec la ML", id: "collab_status_label" },
        { name: "Catégorie", id: "categorie" },
        { name: "Mission Locale de rattachement", id: "mission_locale_nom" },
        { name: "Retour de la Mission Locale", id: "situation_label" },
      ];

      const workbook = new ExcelJs.Workbook();
      const worksheet = workbook.addWorksheet("Dossiers suivis");
      worksheet.addRows(formatJsonToXlsx(rows, columns));

      const fileName = `Suivi_Missions_Locales_TBA_${new Date().toISOString().split("T")[0]}.xlsx`;
      res.attachment(fileName);
      res.contentType("xlsx");
      const buffer = await workbook.xlsx.writeBuffer();
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  });

  router.get(
    "/effectif/:id",
    returnResult(async (req, { locals }) => {
      if (!ObjectId.isValid(req.params.id)) {
        throw Boom.badRequest("ID effectif invalide");
      }
      const { organismeId } = await getOrganismeWithDeca(locals);
      const userId = req.user?._id ? new ObjectId(req.user._id) : undefined;
      return await getCfaEffectifDetail(organismeId, req.params.id, userId);
    })
  );

  router.post(
    "/effectif/:id/declare-rupture",
    returnResult(async (req, { locals }) => {
      if (!ObjectId.isValid(req.params.id)) {
        throw Boom.badRequest("ID effectif invalide");
      }
      const { organismeId, isAllowedDeca } = await getOrganismeWithDeca(locals);
      const { date_rupture, source } = await validateFullZodObjectSchema(req.body, zDeclareRuptureBody);
      if (source === "effectifsDECA" && !isAllowedDeca) {
        throw Boom.forbidden("DECA access not allowed for this organisme");
      }
      const userId = req.user?._id ? new ObjectId(req.user._id) : undefined;
      if (!userId) {
        throw Boom.unauthorized("Utilisateur non authentifié");
      }
      return await declareCfaEffectifRupture(organismeId, req.params.id, source, new Date(date_rupture), userId);
    })
  );

  return router;
};
