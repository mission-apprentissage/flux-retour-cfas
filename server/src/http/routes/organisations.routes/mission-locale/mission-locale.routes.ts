import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import { API_TRAITEMENT_TYPE, IEffectif, IOrganisationMissionLocale } from "shared/models";
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
import { getAgeFromDate } from "@/common/utils/miscUtils";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { addSheetToXlscFile } from "@/common/utils/xlsxUtils";
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

const exportEffectifMissionLocale = async ({ query, user }, res) => {
  const filters = await validateFullZodObjectSchema(query, effectifsParMoisFiltersMissionLocaleSchema);
  const missionLocale = res.locals.missionLocale as IOrganisationMissionLocale;
  const effectifList = await getEffectifsListByMisisonLocaleId(missionLocale.ml_id, missionLocale._id, filters);

  const computeFileName = (
    t: API_TRAITEMENT_TYPE
  ): { worksheetName: string; logsTag: "ml_a_traiter" | "ml_traite" } => {
    switch (t) {
      case API_TRAITEMENT_TYPE.A_TRAITER:
        return {
          worksheetName: "à traiter (nouveaux)",
          logsTag: "ml_a_traiter",
        };
      case API_TRAITEMENT_TYPE.TRAITE:
        return {
          worksheetName: "déjà traités",
          logsTag: "ml_traite",
        };
    }
  };

  const fileInfo = computeFileName(filters.type);
  const fileName = `Rupturants_TBA_${new Date().toISOString().split("T")[0]}.xlsx`;

  const columns = [
    { name: "Date transmission données", id: "transmitted_at" },
    { name: "Source données", id: "source" },
    { name: "NOM", id: "nom" },
    { name: "Prénom", id: "prenom" },
    { name: "Date rupture contrat", id: "contrat_date_rupture", transform: (d) => new Date(d) },
    { name: "Date début contrat", id: "contrat_date_debut", transform: (d) => new Date(d) },
    { name: "Date fin de contrat", id: "contrat_date_fin", transform: (d) => new Date(d) },
    { name: "Date de naissance", id: "date_de_naissance", transform: (d) => new Date(d) },
    { name: "Age", id: "date_de_naissance", transform: getAgeFromDate },
    { name: "RQTH", id: "rqth" },
    { name: "Ville de résidence", id: "commune" },
    { name: "Code postal de résidence", id: "code_postal" },
    { name: "Téléphone", id: "telephone" },
    { name: "Email", id: "email" },
    { name: "Téléphone responsable légal 1", id: "telephone_responsable_1" },
    { name: "Email responsable légal 1", id: "email_responsable_1" },
    { name: "Téléphone responsable légal 2", id: "telephone_responsable_2" },
    { name: "Email responsable légal 2", id: "email_responsable_2" },
    { name: "Intitulé de la formation", id: "libelle_formation" },
    { name: "Nom du CFA", id: "organisme_nom" },
    { name: "Code postal du CFA", id: "organisme_code_postal" },
    { name: "Téléphone du CFA", id: "organisme_telephone" },
    { name: "Email du CFA", id: "organisme_email" },
  ];

  const templateFile = await addSheetToXlscFile(
    "mission-locale/modele-rupturant-ml.xlsx",
    fileInfo.worksheetName,
    columns,
    effectifList
  );

  res.attachment(fileName);
  res.contentType("xlsx");
  await createTelechargementListeNomLog(
    fileInfo.logsTag,
    effectifList.map(({ _id }) => _id.toString()),
    new Date(),
    user?._id,
    undefined,
    missionLocale._id
  );
  return templateFile.xlsx.writeBuffer();
};
