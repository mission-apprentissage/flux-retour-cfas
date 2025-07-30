import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import {
  API_EFFECTIF_LISTE,
  IMissionLocaleEffectif,
  IOrganisationMissionLocale,
  SITUATION_LABEL_ENUM,
  updateMissionLocaleEffectifApi,
} from "shared/models";
import {
  effectifMissionLocaleListe,
  effectifsParMoisFiltersMissionLocaleAPISchema,
} from "shared/models/routes/mission-locale/missionLocale.api";

import {
  getAllEffectifsParMois,
  getEffectifFromMissionLocaleId,
  getEffectifsListByMisisonLocaleId,
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

const updateEffectifMissionLocaleData = async (req, { locals }) => {
  const effectifId = req.params.id;
  const user = req.user;
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  const data = await validateFullZodObjectSchema(req.body, updateMissionLocaleEffectifApi);

  const effectif: IMissionLocaleEffectif | null = await missionLocaleEffectifsDb().findOne({
    effectif_id: new ObjectId(effectifId),
    mission_locale_id: new ObjectId(missionLocale._id),
  });

  if (!effectif) {
    throw Boom.notFound("Effectif introuvable");
  }
  return await setEffectifMissionLocaleData(missionLocale._id, effectifId, data, user);
};

const getEffectifsParMoisMissionLocale = async (_req, { locals }) => {
  const missionLocale = locals.missionLocale;
  if (!missionLocale) {
    throw Boom.forbidden("No mission locale in session");
  }

  return await getAllEffectifsParMois(missionLocale, missionLocale.activated_at);
};

const getEffectifMissionLocale = async (req, { locals }) => {
  const { nom_liste } = await validateFullZodObjectSchema(req.query, effectifMissionLocaleListe);
  const effectifId = req.params.id;
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;

  return await getEffectifFromMissionLocaleId(missionLocale, effectifId, nom_liste, missionLocale.activated_at);
};

const exportEffectifMissionLocale = async (req, res) => {
  const filters = await validateFullZodObjectSchema(req.query, effectifsParMoisFiltersMissionLocaleAPISchema);
  const missionLocale = res.locals.missionLocale as IOrganisationMissionLocale;

  const computeFileInfo = async (types: Array<API_EFFECTIF_LISTE>) => {
    const dataArr: Array<{
      worksheetName: string;
      logsTag: "ml_a_traiter" | "ml_traite" | "ml_injoignable";
      data: Array<Record<string, string>>;
    }> = [];
    for (const type of types) {
      switch (type) {
        case API_EFFECTIF_LISTE.A_TRAITER:
          dataArr.push({
            worksheetName: "À traiter",
            logsTag: "ml_a_traiter" as const,
            data: (await getEffectifsListByMisisonLocaleId(
              missionLocale,
              { type },
              missionLocale.activated_at
            )) as Array<Record<string, string>>,
          });
          break;
        case API_EFFECTIF_LISTE.TRAITE:
          dataArr.push({
            worksheetName: "Déjà traités",
            logsTag: "ml_traite" as const,
            data: (await getEffectifsListByMisisonLocaleId(
              missionLocale,
              { type },
              missionLocale.activated_at
            )) as Array<Record<string, string>>,
          });
          break;
        case API_EFFECTIF_LISTE.INJOIGNABLE:
          dataArr.push({
            worksheetName: "Injoignable",
            logsTag: "ml_injoignable" as const,
            data: (await getEffectifsListByMisisonLocaleId(
              missionLocale,
              { type },
              missionLocale.activated_at
            )) as Array<Record<string, string>>,
          });
          break;
        default:
          throw new Error(`Unhandled API_EFFECTIF_LISTE: ${type}`);
      }
    }

    return dataArr;
  };

  const worksheetsInfo = await computeFileInfo(filters.type);
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
    { name: "Dernière campagne mailing", id: "effectif_choice" },
    {
      name: "Quel est votre retour sur la prise de contact ?",
      id: "ml_situation",
      transform: (val) => {
        if (!val) {
          return "Aucun retour";
        }

        switch (val) {
          case "RDV_PRIS":
            return SITUATION_LABEL_ENUM.RDV_PRIS;
          case "NOUVEAU_PROJET":
            return SITUATION_LABEL_ENUM.NOUVEAU_PROJET;
          case "DEJA_ACCOMPAGNE":
            return SITUATION_LABEL_ENUM.DEJA_ACCOMPAGNE;
          case "CONTACTE_SANS_RETOUR":
            return SITUATION_LABEL_ENUM.CONTACTE_SANS_RETOUR;
          case "COORDONNEES_INCORRECT":
            return SITUATION_LABEL_ENUM.COORDONNEES_INCORRECT;
          case "AUTRE": {
            return SITUATION_LABEL_ENUM.AUTRE;
          }
          default:
            return val;
        }
      },
      listValues: [
        "Aucun retour",
        SITUATION_LABEL_ENUM.RDV_PRIS,
        SITUATION_LABEL_ENUM.NOUVEAU_PROJET,
        SITUATION_LABEL_ENUM.DEJA_ACCOMPAGNE,
        SITUATION_LABEL_ENUM.CONTACTE_SANS_RETOUR,
        SITUATION_LABEL_ENUM.COORDONNEES_INCORRECT,
        SITUATION_LABEL_ENUM.AUTRE,
      ],
    },
    {
      name: "Commentaire sur la situation",
      id: "ml_situation_autre",
    },
    {
      name: "Ce jeune était-il déjà connu de votre Mission Locale ?",
      id: "ml_deja_connu",
      transform: (val) => (val ? "OUI" : "NON"),
      listValues: ["OUI", "NON"],
    },
    {
      name: "Avez-vous des commentaires ? (optionnel)",
      id: "ml_commentaires",
    },
  ];

  const templateFile = await addSheetToXlscFile("mission-locale/modele-rupturant-ml.xlsx", worksheetsInfo, columns);

  res.attachment(fileName);
  res.contentType("xlsx");

  const date = new Date();
  worksheetsInfo.forEach(async ({ logsTag, data }) => {
    await createTelechargementListeNomLog(
      logsTag,
      data.map(({ _id }) => _id.toString()),
      date,
      req.user?._id,
      undefined,
      missionLocale._id
    );
  });

  return templateFile?.xlsx.writeBuffer();
};
