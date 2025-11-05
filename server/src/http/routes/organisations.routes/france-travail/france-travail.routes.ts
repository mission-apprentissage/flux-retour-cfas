import Boom from "boom";
import express from "express";
import { FRANCE_TRAVAIL_SITUATION_LABELS, TOUS_LES_SECTEURS_CODE } from "shared/constants";
import { API_EFFECTIF_LISTE, IOrganisationFranceTravail } from "shared/models";
import { zFranceTravailSituationEnum } from "shared/models/data/franceTravailEffectif.model";
import {
  codeSecteurSchema,
  effectifFranceTravailQuerySchema,
  franceTravailEffectifsQuerySchema,
  IEffectifFranceTravailQuery,
  IFranceTravailEffectifsQuery,
} from "shared/models/routes/france-travail/franceTravail.api";
import { z } from "zod";

import {
  getAllFranceTravailEffectifsByCodeSecteur,
  getAllFranceTravailEffectifsTraites,
  getDepartementCountsBySecteur,
  getEffectifFromFranceTravailId,
  getEffectifSecteurActivitesArboresence,
  getFranceTravailEffectifsByCodeSecteur,
  getFranceTravailEffectifsTraitesMois,
  getFranceTravailEffectifsTraitesParMois,
  updateFranceTravailData,
} from "@/common/actions/franceTravail/franceTravailEffectif.actions";
import { getSecteurActivitesByCode } from "@/common/actions/rome/rome.actions";
import { createTelechargementListeNomLog } from "@/common/actions/telechargementListeNomLogs.actions";
import { getAgeFromDate } from "@/common/utils/miscUtils";
import { addSheetToXlscFile } from "@/common/utils/xlsxUtils";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get("/arborescence", returnResult(getArborescence));
  router.get(
    "/departement-counts/:code_secteur",
    validateRequestMiddleware({
      params: z.object({
        code_secteur: codeSecteurSchema,
      }),
    }),
    returnResult(async (req, { locals }) => {
      const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
      const code_secteur = Number(req.params.code_secteur);
      return getDepartementCountsBySecteur(ftOrga.code_region, code_secteur);
    })
  );
  router.get("/effectifs/traite/mois", returnResult(getEffectifsTraitesMois));
  router.get(
    "/effectifs/traite/mois/:mois",
    validateRequestMiddleware({
      params: z.object({
        mois: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month format: expected YYYY-MM"),
      }),
      query: franceTravailEffectifsQuerySchema,
    }),
    returnResult(getEffectifsTraitesParMois)
  );

  router.get(
    "/effectifs/a-traiter/:code_secteur",
    validateRequestMiddleware({
      params: z.object({
        code_secteur: codeSecteurSchema,
      }),
      query: franceTravailEffectifsQuerySchema,
    }),
    returnResult(async (req, { locals }) => {
      const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
      const code_secteur = Number(req.params.code_secteur);
      const { page, limit, search, sort, order, departements } = req.query as IFranceTravailEffectifsQuery;

      return getFranceTravailEffectifsByCodeSecteur(ftOrga.code_region, API_EFFECTIF_LISTE.A_TRAITER, code_secteur, {
        page,
        limit,
        search,
        sort,
        order,
        departements,
      });
    })
  );
  router.get(
    "/effectif/:id",
    validateRequestMiddleware({
      params: z.object({
        id: z.string().min(1),
      }),
      query: effectifFranceTravailQuerySchema,
    }),
    returnResult(getEffectifById)
  );

  router.get(
    "/export/effectifs/:code_secteur",
    validateRequestMiddleware({
      params: z.object({
        code_secteur: codeSecteurSchema,
      }),
      query: z.object({
        departements: z.string().optional().describe("Codes départements séparés par des virgules"),
      }),
    }),
    returnResult(exportEffectifByCodeSecteur)
  );

  router.get(
    "/export/effectifs-traites",
    validateRequestMiddleware({
      query: z.object({
        mois: z
          .string()
          .regex(/^\d{4}-\d{2}$/, "Invalid month format: expected YYYY-MM")
          .optional(),
      }),
    }),
    returnResult(exportEffectifsTraites)
  );

  router.put(
    "/effectif/:id",
    validateRequestMiddleware({
      params: z.object({
        id: z.string().describe("ID de l'effectif France Travail"),
      }),
      body: z.object({
        commentaire: z.string().nullable().describe("Commentaire à ajouter ou mettre à jour"),
        situation: zFranceTravailSituationEnum.describe("Situation actuelle de l'effectif"),
        code_secteur: z.number(),
      }),
    }),
    returnResult(updateEffectifById)
  );

  return router;
};

const getArborescence = async (_req, { locals }) => {
  const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
  return getEffectifSecteurActivitesArboresence(ftOrga.code_region);
};

const getEffectifById = async (req, { locals }) => {
  const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
  const { nom_liste, code_secteur, search, sort, order, mois, departements } = req.query as IEffectifFranceTravailQuery;
  const effectifId = req.params.id;

  return await getEffectifFromFranceTravailId(ftOrga.code_region, code_secteur, effectifId, nom_liste, {
    search,
    sort,
    order,
    mois,
    departements,
  });
};

const updateEffectifById = async (req) => {
  const effectifId = req.params.id;
  const user = req.user;
  const body = req.body;

  await updateFranceTravailData(effectifId, body.commentaire, body.situation, body.code_secteur, user._id);
};

const exportEffectifByCodeSecteur = async (req, res) => {
  const ftOrga = res.locals.franceTravail as IOrganisationFranceTravail;
  const code_secteur = Number(req.params.code_secteur);
  const departements = req.query.departements as string | undefined;

  let secteurLibelle: string;

  if (code_secteur === TOUS_LES_SECTEURS_CODE) {
    secteurLibelle = "Tous les secteurs";
  } else {
    const secteurActivite = await getSecteurActivitesByCode(code_secteur);
    if (!secteurActivite) {
      throw Boom.notFound("Secteur d'activité introuvable");
    }
    secteurLibelle = secteurActivite.libelle_secteur;
  }

  const fileName = `inscrit-sans-contrats-TBA-${new Date().toISOString().split("T")[0]}.xlsx`;

  const columns = [
    { name: "Prénom", id: "prenom" },
    { name: "Nom", id: "nom" },
    { name: "RQTH", id: "rqth", transform: (d) => (d ? "OUI" : "NON") },
    { name: "Ville de résidence", id: "commune" },
    { name: "Age", id: "date_de_naissance", transform: getAgeFromDate },
    { name: "Téléphone", id: "telephone" },
    { name: "Email", id: "email" },
    { name: "Téléphone responsable légal 1", id: "telephone_responsable_1" },
    { name: "Email responsable légal 1", id: "email_responsable_1" },
    { name: "Téléphone responsable légal 2", id: "telephone_responsable_2" },
    { name: "Email responsable légal 2", id: "email_responsable_2" },
    { name: "Nom du CFA", id: "organisme_nom" },
    { name: "Commune du CFA", id: "organisme_commune" },
    { name: "Code postal du CFA", id: "organisme_code_postal" },
    { name: "Téléphone du CFA (utilisateur Tableau de Bord)", array: "tdb_organisme_contacts", id: "telephone" },
    { name: "Email du CFA (utilisateur Tableau de Bord)", array: "tdb_organisme_contacts", id: "email" },
    { name: "Email du CFA (données publique)", array: "organisme_contacts", id: "email" },
    { name: "Intitulé de la formation", id: "libelle_formation" },
    { name: "Niveau de la formation", id: "niveau_formation" },
    { name: "Date d'inscription", id: "date_inscription", transform: (d) => new Date(d) },
    {
      name: "Durée sans contrat /90j",
      id: "date_inscription",
      transform: (d) => {
        const diffTime = Math.abs(new Date().getTime() - new Date(d).getTime());
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
      },
    },
  ];
  const worksheetsInfo = [
    {
      worksheetName: `A traiter - ${secteurLibelle}`,
      logsTag: `ft_a_traiter` as const,
      data: await getAllFranceTravailEffectifsByCodeSecteur(ftOrga.code_region, code_secteur, { departements }),
    },
  ];
  const templateFile = await addSheetToXlscFile(
    "mission-locale/modele-inscrit-sans-contrat-ft.xlsx",
    worksheetsInfo,
    columns
  );
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
        ftOrga._id
      );
    })
  );

  return templateFile?.xlsx.writeBuffer();
};

const exportEffectifsTraites = async (req, res) => {
  const ftOrga = res.locals.franceTravail as IOrganisationFranceTravail;
  const mois = req.query.mois as string | undefined;

  const fileName = mois
    ? `dossiers-traites-${mois}-${new Date().toISOString().split("T")[0]}.xlsx`
    : `dossiers-traites-${new Date().toISOString().split("T")[0]}.xlsx`;

  const columns = [
    { name: "Prénom", id: "prenom" },
    { name: "Nom", id: "nom" },
    { name: "RQTH", id: "rqth", transform: (d) => (d ? "OUI" : "NON") },
    { name: "Ville de résidence", id: "commune" },
    { name: "Age", id: "date_de_naissance", transform: getAgeFromDate },
    { name: "Téléphone", id: "telephone" },
    { name: "Email", id: "email" },
    { name: "Téléphone responsable légal 1", id: "telephone_responsable_1" },
    { name: "Email responsable légal 1", id: "email_responsable_1" },
    { name: "Téléphone responsable légal 2", id: "telephone_responsable_2" },
    { name: "Email responsable légal 2", id: "email_responsable_2" },
    { name: "Nom du CFA", id: "organisme_nom" },
    { name: "Commune du CFA", id: "organisme_commune" },
    { name: "Code postal du CFA", id: "organisme_code_postal" },
    { name: "Téléphone du CFA (utilisateur Tableau de Bord)", array: "tdb_organisme_contacts", id: "telephone" },
    { name: "Email du CFA (utilisateur Tableau de Bord)", array: "tdb_organisme_contacts", id: "email" },
    { name: "Email du CFA (données publique)", array: "organisme_contacts", id: "email" },
    { name: "Intitulé de la formation", id: "libelle_formation" },
    { name: "Niveau de la formation", id: "niveau_formation" },
    { name: "Date d'inscription", id: "date_inscription", transform: (d) => new Date(d) },
    { name: "Date de traitement", id: "date_traitement", transform: (d) => new Date(d) },
    { name: "Situation", id: "situation", transform: (d) => (d ? FRANCE_TRAVAIL_SITUATION_LABELS[d] || d : "") },
    { name: "Commentaire", id: "commentaire" },
  ];

  const worksheetName = mois ? `Traités - ${mois}` : "Traités";
  const worksheetsInfo = [
    {
      worksheetName,
      logsTag: `ft_traite` as const,
      data: await getAllFranceTravailEffectifsTraites(ftOrga.code_region, mois),
    },
  ];

  const templateFile = await addSheetToXlscFile(
    "mission-locale/modele-inscrit-sans-contrat-ft.xlsx",
    worksheetsInfo,
    columns
  );
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
        ftOrga._id
      );
    })
  );

  return templateFile?.xlsx.writeBuffer();
};

const getEffectifsTraitesMois = async (_req, { locals }) => {
  const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
  return getFranceTravailEffectifsTraitesMois(ftOrga.code_region);
};

const getEffectifsTraitesParMois = async (req, { locals }) => {
  const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
  const { page, limit, search, sort, order, departements } = req.query as IFranceTravailEffectifsQuery;
  const mois = req.params.mois;

  return getFranceTravailEffectifsTraitesParMois(ftOrga.code_region, mois, {
    page,
    limit,
    search,
    sort,
    order,
    departements,
  });
};
