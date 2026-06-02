import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import { ML_SITUATION_DOSSIER_LABEL } from "shared/constants";
import {
  API_EFFECTIF_LISTE,
  IMissionLocaleEffectif,
  IOrganisationMissionLocale,
  SITUATION_LABEL_ENUM,
  updateMissionLocaleEffectifApi,
} from "shared/models";
import { httpUrlSchema } from "shared/models/data/organisations.model";
import {
  effectifMissionLocaleListe,
  effectifsFusionnesQuerySchema,
  effectifsParMoisFiltersMissionLocaleAPISchema,
} from "shared/models/routes/mission-locale/missionLocale.api";
import { z } from "zod";

import { getCfaListToInviteForMissionLocale } from "@/common/actions/mission-locale/mission-locale-cfa-invitation.actions";
import {
  getAllEffectifsParMois,
  getEffectifFromMissionLocaleId,
  getEffectifsFusionnesByMissionLocaleId,
  getEffectifsListByMissionLocaleId,
  getPostalCodesByMissionLocaleId,
  missionLocaleBaseAggregation,
  setEffectifMissionLocaleData,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { createTelechargementListeNomLog } from "@/common/actions/telechargementListeNomLogs.actions";
import { missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";
import { getAgeFromDate } from "@/common/utils/miscUtils";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { addSheetToXlscFile } from "@/common/utils/xlsxUtils";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();
  router.get("/effectif/:id", returnResult(getEffectifMissionLocale));
  router.get("/effectifs", returnResult(getEffectifsFusionnesMissionLocale));
  router.get("/effectifs-per-month", returnResult(getEffectifsParMoisMissionLocale));
  router.get("/villes", returnResult(getVillesMissionLocale));
  router.get("/export/effectifs", returnResult(exportEffectifMissionLocale));
  router.post("/effectif/:id", returnResult(updateEffectifMissionLocaleData));
  router.get("/parametres", returnResult(getMlParametres));
  router.put("/parametres", returnResult(updateMlParametres));
  router.get("/banner-stats", returnResult(getMlBannerStats));
  return router;
};

const getMlBannerStats = async (_req, { locals }) => {
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  // Le compteur du bandeau doit refléter exactement ce que le conseiller retrouve dans la liste.
  // On réutilise donc le pipeline de visibilité (mêmes filtres âge / année scolaire / activation que
  // la liste et le récap hebdo) plutôt qu'un countDocuments brut : ce dernier comptait aussi des jeunes
  // filtrés hors liste (≥ 26 ans, année scolaire hors plage, sans date de rupture) et gonflait le bandeau.
  const result = await missionLocaleEffectifsDb()
    .aggregate([
      { $match: { souhaite_rdv: true } },
      ...(await missionLocaleBaseAggregation(missionLocale)),
      // On ne compte que les jeunes encore actionnables : « à traiter » (situation nulle) ou
      // « à recontacter » (CONTACTE_SANS_RETOUR). On exclut les « déjà traités » (RDV déjà pris,
      // nouveau projet…), sinon le bandeau « contactez-les » compte des jeunes déjà pris en charge,
      // absents des listes que le conseiller consulte.
      { $match: { $or: [{ a_traiter: true }, { injoignable: true }] } },
      { $count: "souhaite_rdv_count" },
    ])
    .next();
  return { souhaite_rdv_count: result?.souhaite_rdv_count ?? 0 };
};

const zMlParametresBody = z.object({
  rdv_url: httpUrlSchema.nullable(),
});

const getMlParametres = async (_req, { locals }) => {
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  return { rdv_url: missionLocale.rdv_url ?? null };
};

const updateMlParametres = async (req, { locals }) => {
  const router = express.Router();
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  const body = zMlParametresBody.parse(req.body);

  await organisationsDb().updateOne(
    { _id: new ObjectId(missionLocale._id), type: "MISSION_LOCALE" },
    { $set: { rdv_url: body.rdv_url } }
  );

  router.get("/cfa-invitations", returnResult(getCfaInvitationsList));
  return router;
};

const getCfaInvitationsList = async (req, { locals }) => {
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  if (!missionLocale) {
    throw Boom.forbidden("No mission locale in session");
  }
  const userId = new ObjectId(req.user._id);
  return await getCfaListToInviteForMissionLocale(missionLocale, userId);
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

const getEffectifsParMoisMissionLocale = async (req, { locals }) => {
  const missionLocale = locals.missionLocale;
  if (!missionLocale) {
    throw Boom.forbidden("No mission locale in session");
  }

  const userId = req.user?._id ? new ObjectId(req.user._id) : undefined;
  return await getAllEffectifsParMois(missionLocale, userId);
};

const getEffectifsFusionnesMissionLocale = async (req, { locals }) => {
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  if (!missionLocale) {
    throw Boom.forbidden("No mission locale in session");
  }

  const { nom_liste, tri, ordre } = await validateFullZodObjectSchema(req.query, effectifsFusionnesQuerySchema);
  return await getEffectifsFusionnesByMissionLocaleId(
    missionLocale,
    nom_liste,
    tri ? { colonne: tri, ordre: ordre ?? "asc" } : null
  );
};

const getVillesMissionLocale = async (_req, { locals }) => {
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  if (!missionLocale) {
    throw Boom.forbidden("No mission locale in session");
  }
  return await getPostalCodesByMissionLocaleId(missionLocale);
};

const getEffectifMissionLocale = async (req, { locals }) => {
  const { nom_liste, code_postal, tri, ordre } = await validateFullZodObjectSchema(
    req.query,
    effectifMissionLocaleListe
  );
  const effectifId = req.params.id;
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;

  const userId = req.user?._id ? new ObjectId(req.user._id) : undefined;
  const codesPostaux = code_postal ? code_postal.split(",").filter(Boolean) : undefined;
  return await getEffectifFromMissionLocaleId(
    missionLocale,
    effectifId,
    nom_liste,
    userId,
    codesPostaux,
    tri ? { colonne: tri, ordre: ordre ?? "asc" } : null
  );
};

const exportEffectifMissionLocale = async (req, res) => {
  const filters = await validateFullZodObjectSchema(req.query, effectifsParMoisFiltersMissionLocaleAPISchema);
  const missionLocale = res.locals.missionLocale as IOrganisationMissionLocale;

  const computeFileInfo = async (types: Array<API_EFFECTIF_LISTE>, month?: string) => {
    const dataArr: Array<{
      worksheetName: string;
      logsTag:
        | "ml_a_traiter"
        | "ml_traite"
        | "ml_injoignable"
        | "ml_a_traiter_ou_recontacter"
        | "ml_collab_a_traiter_ou_recontacter"
        | "ml_collab_traite";
      data: Array<Record<string, string>>;
    }> = [];
    for (const type of types) {
      let effectifsList = (await getEffectifsListByMissionLocaleId(missionLocale, { type, month })) as Array<
        Record<string, string>
      >;

      switch (type) {
        case API_EFFECTIF_LISTE.A_TRAITER:
          dataArr.push({
            worksheetName: "À traiter",
            logsTag: "ml_a_traiter" as const,
            data: effectifsList,
          });
          break;
        case API_EFFECTIF_LISTE.TRAITE:
          dataArr.push({
            worksheetName: "Déjà traités",
            logsTag: "ml_traite" as const,
            data: effectifsList,
          });
          break;
        case API_EFFECTIF_LISTE.INJOIGNABLE:
          dataArr.push({
            worksheetName: "À recontacter",
            logsTag: "ml_injoignable" as const,
            data: effectifsList,
          });
          break;
        case API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER:
          dataArr.push({
            worksheetName: "À traiter ou recontacter",
            logsTag: "ml_a_traiter_ou_recontacter" as const,
            data: effectifsList,
          });
          break;
        case API_EFFECTIF_LISTE.COLLAB_A_TRAITER_OU_RECONTACTER:
          dataArr.push({
            // Excel tronque au-delà de 31 caractères : garder ce libellé court.
            worksheetName: "Collab. à traiter/recontacter",
            logsTag: "ml_collab_a_traiter_ou_recontacter" as const,
            data: effectifsList,
          });
          break;
        case API_EFFECTIF_LISTE.COLLAB_TRAITE:
          dataArr.push({
            worksheetName: "Collab. traités",
            logsTag: "ml_collab_traite" as const,
            data: effectifsList,
          });
          break;
        default:
          throw Boom.badRequest(`Type de liste non exportable: ${type}`);
      }
    }

    return dataArr;
  };

  const worksheetsInfo = await computeFileInfo(filters.type, filters.month);
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
    { name: "Date rupture contrat", id: "contrat_date_rupture", transform: (d) => (d ? new Date(d) : "") },
    { name: "Date début contrat", id: "contrat_date_debut", transform: (d) => (d ? new Date(d) : "") },
    { name: "Date fin de contrat", id: "contrat_date_fin", transform: (d) => (d ? new Date(d) : "") },
    { name: "Date de naissance", id: "date_de_naissance", transform: (d) => new Date(d) },
    { name: "Age", id: "date_de_naissance", transform: getAgeFromDate },
    { name: "RQTH", id: "rqth", transform: (d) => (d ? "OUI" : "NON") },
    { name: "Collaboration CFA", id: "collaboration_cfa", transform: (d) => (d ? "OUI" : "NON") },
    {
      name: "Situation",
      id: "situation_dossier",
      transform: (val) => (val ? (ML_SITUATION_DOSSIER_LABEL[val] ?? val) : ""),
      listValues: Object.values(ML_SITUATION_DOSSIER_LABEL),
    },
    { name: "Date de réception du dossier", id: "date_reception", transform: (d) => (d ? new Date(d) : "") },
    {
      name: "À recontacter depuis le",
      id: "date_dernier_passage_a_recontacter",
      transform: (d) => (d ? new Date(d) : ""),
    },
    { name: "Date de traitement", id: "date_traitement", transform: (d) => (d ? new Date(d) : "") },
    { name: "Disponible WhatsApp", id: "disponible_whatsapp", transform: (d) => (d ? "OUI" : "NON") },
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
          case "INJOIGNABLE_APRES_RELANCES":
            return SITUATION_LABEL_ENUM.INJOIGNABLE_APRES_RELANCES;
          case "CHERCHE_CONTRAT":
            return SITUATION_LABEL_ENUM.CHERCHE_CONTRAT;
          case "REORIENTATION":
            return SITUATION_LABEL_ENUM.REORIENTATION;
          case "NE_VEUT_PAS_ACCOMPAGNEMENT":
            return SITUATION_LABEL_ENUM.NE_VEUT_PAS_ACCOMPAGNEMENT;
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
        SITUATION_LABEL_ENUM.INJOIGNABLE_APRES_RELANCES,
        SITUATION_LABEL_ENUM.CHERCHE_CONTRAT,
        SITUATION_LABEL_ENUM.REORIENTATION,
        SITUATION_LABEL_ENUM.NE_VEUT_PAS_ACCOMPAGNEMENT,
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
  await Promise.all(
    worksheetsInfo.map(async ({ logsTag, data }) => {
      return createTelechargementListeNomLog(
        logsTag,
        data.map(({ _id }) => _id.toString()),
        date,
        req.user?._id,
        undefined,
        missionLocale._id
      );
    })
  );

  return templateFile?.xlsx.writeBuffer();
};
