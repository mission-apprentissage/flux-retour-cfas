import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import {
  API_TRAITEMENT_TYPE,
  IMissionLocaleEffectif,
  IOrganisationMissionLocale,
  updateMissionLocaleEffectifApi,
} from "shared/models";
import {
  effectifMissionLocaleListe,
  effectifsParMoisFiltersMissionLocaleSchema,
} from "shared/models/routes/mission-locale/missionLocale.api";

import {
  getEffectifARisqueByMissionLocaleId,
  getEffectifFromMissionLocaleId,
  getEffectifsListByMisisonLocaleId,
  getEffectifsParMoisByMissionLocaleId,
  setEffectifMissionLocaleData,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { createTelechargementListeNomLog } from "@/common/actions/telechargementListeNomLogs.actions";
import { missionLocaleEffectifsDb } from "@/common/model/collections";
import { getAgeFromDate } from "@/common/utils/miscUtils";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { addSheetToXlscFile } from "@/common/utils/xlsxUtils";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();
  router.get("/effectif/:id", returnResult(getEffectifMissionLocale));
  router.get("/effectifs-per-month", returnResult(getEffectifsParMoisMissionLocale));
  router.get("/export/effectifs", returnResult(exportEffectifMissionLocale));
  router.post("/effectif/:id", returnResult(updateEffectifMissionLocaleData));
  return router;
};

const updateEffectifMissionLocaleData = async ({ body, params }, { locals }) => {
  const effectifId = params.id;
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  const data = await validateFullZodObjectSchema(body, updateMissionLocaleEffectifApi);

  const effectif: IMissionLocaleEffectif | null = await missionLocaleEffectifsDb().findOne({
    effectif_id: new ObjectId(effectifId),
    mission_locale_id: new ObjectId(missionLocale._id),
  });

  if (!effectif) {
    throw Boom.notFound("Effectif introuvable");
  }
  return await setEffectifMissionLocaleData(missionLocale._id, effectifId, data);
};

const getEffectifsParMoisMissionLocale = async (req, { locals }) => {
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;

  const [a_traiter, traite, prioritaire] = await Promise.all([
    getEffectifsParMoisByMissionLocaleId(
      missionLocale._id,
      { type: API_TRAITEMENT_TYPE.A_TRAITER },
      missionLocale.activated_at
    ),
    getEffectifsParMoisByMissionLocaleId(
      missionLocale._id,
      { type: API_TRAITEMENT_TYPE.TRAITE },
      missionLocale.activated_at
    ),
    getEffectifARisqueByMissionLocaleId(missionLocale._id),
  ]);
  return {
    a_traiter,
    traite,
    prioritaire,
  };
};

const getEffectifMissionLocale = async (req, { locals }) => {
  const { nom_liste } = await validateFullZodObjectSchema(req.query, effectifMissionLocaleListe);
  const effectifId = req.params.id;
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;

  return await getEffectifFromMissionLocaleId(missionLocale._id, effectifId, nom_liste, missionLocale.activated_at);
};

const exportEffectifMissionLocale = async (req, res) => {
  const filters = await validateFullZodObjectSchema(req.query, effectifsParMoisFiltersMissionLocaleSchema);
  const missionLocale = res.locals.missionLocale as IOrganisationMissionLocale;
  const effectifList = await getEffectifsListByMisisonLocaleId(missionLocale._id, filters, missionLocale.activated_at);

  const computeFileName = (
    t: API_TRAITEMENT_TYPE
  ): { worksheetToKeepName: string; worksheetToDeleteName: string; logsTag: "ml_a_traiter" | "ml_traite" } => {
    switch (t) {
      case API_TRAITEMENT_TYPE.A_TRAITER:
        return {
          worksheetToKeepName: "À traiter",
          worksheetToDeleteName: "Déjà traités",
          logsTag: "ml_a_traiter",
        };
      case API_TRAITEMENT_TYPE.TRAITE:
        return {
          worksheetToKeepName: "Déjà traités",
          worksheetToDeleteName: "À traiter",
          logsTag: "ml_traite",
        };
    }
  };

  const fileInfo = computeFileName(filters.type);
  const fileName = `Rupturants_TBA_${new Date().toISOString().split("T")[0]}.xlsx`;

  const columns = [
    {
      name: "Date transmission données",
      id: "transmitted_at",
      transform: (d) => (d ? new Date(d) : "Plus de 2 semaines"),
    },
    { name: "Source données", id: "source" },
    { name: "NOM", id: "nom" },
    { name: "Prénom", id: "prenom" },
    { name: "Date rupture contrat", id: "contrat_date_rupture", transform: (d) => new Date(d) },
    { name: "Date début contrat", id: "contrat_date_debut", transform: (d) => new Date(d) },
    { name: "Date fin de contrat", id: "contrat_date_fin", transform: (d) => new Date(d) },
    { name: "Date de naissance", id: "date_de_naissance", transform: (d) => new Date(d) },
    { name: "Age", id: "date_de_naissance", transform: getAgeFromDate },
    { name: "RQTH", id: "rqth", transform: (d) => (d ? "OUI" : "NON") },
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
    { name: "Téléphone du CFA (utilisateur Tableau de Bord)", array: "tdb_organisme_contacts", id: "telephone" },
    { name: "Email du CFA (utilisateur Tableau de Bord)", array: "tdb_organisme_contacts", id: "email" },
    { name: "Email du CFA (données publique)", array: "organisme_contacts", id: "email" },
  ];

  const templateFile = await addSheetToXlscFile(
    "mission-locale/modele-rupturant-ml.xlsx",
    fileInfo.worksheetToKeepName,
    fileInfo.worksheetToDeleteName,
    columns,
    effectifList
  );

  res.attachment(fileName);
  res.contentType("xlsx");
  await createTelechargementListeNomLog(
    fileInfo.logsTag,
    effectifList.map(({ _id }) => _id.toString()),
    new Date(),
    req.user?._id,
    undefined,
    missionLocale._id
  );
  return templateFile?.xlsx.writeBuffer();
};
