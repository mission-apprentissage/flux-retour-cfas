import Boom from "boom";
import express from "express";
import { FRANCE_TRAVAIL_SITUATION_LABELS, FranceTravailSituationKey, TOUS_LES_SECTEURS_CODE } from "shared/constants";
import { API_EFFECTIF_LISTE } from "shared/models";
import { zFranceTravailSituationEnum } from "shared/models/data/franceTravailEffectif.model";
import {
  codeSecteurSchema,
  effectifFranceTravailQuerySchema,
  franceTravailEffectifsQuerySchema,
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
import { addSheetToXlscFile, XlsxColumn } from "@/common/utils/xlsxUtils";
import {
  DefaultParams,
  DefaultQuery,
  FranceTravailLocals,
  returnResult,
  RouteHandler,
} from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const codeSecteurParams = z.object({ code_secteur: codeSecteurSchema });
const moisParams = z.object({ mois: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month format: expected YYYY-MM") });
const idParams = z.object({ id: z.string().min(1) });
const exportQuery = z.object({
  departements: z.string().optional().describe("Codes départements séparés par des virgules"),
});
const exportTraitesQuery = z.object({
  mois: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Invalid month format: expected YYYY-MM")
    .optional(),
});
const updateEffectifParams = z.object({ id: z.string().describe("ID de l'effectif France Travail") });
const updateEffectifBody = z.object({
  commentaire: z.string().nullable().describe("Commentaire à ajouter ou mettre à jour"),
  situation: zFranceTravailSituationEnum.describe("Situation actuelle de l'effectif"),
  code_secteur: z.number(),
});
type EffectifsQuery = z.infer<typeof franceTravailEffectifsQuerySchema>;

export default () => {
  const router = express.Router();

  router.get("/arborescence", returnResult(getArborescence));
  router.get(
    "/departement-counts/:code_secteur",
    validateRequestMiddleware({ params: codeSecteurParams }),
    returnResult<FranceTravailLocals, z.infer<typeof codeSecteurParams>>(async (req, { locals }) => {
      const code_secteur = Number(req.params.code_secteur);
      return getDepartementCountsBySecteur(locals.franceTravail.code_region, code_secteur);
    })
  );
  router.get("/effectifs/traite/mois", returnResult(getEffectifsTraitesMois));
  router.get(
    "/effectifs/traite/mois/:mois",
    validateRequestMiddleware({ params: moisParams, query: franceTravailEffectifsQuerySchema }),
    returnResult(getEffectifsTraitesParMois)
  );

  router.get(
    "/effectifs/a-traiter/:code_secteur",
    validateRequestMiddleware({ params: codeSecteurParams, query: franceTravailEffectifsQuerySchema }),
    returnResult<FranceTravailLocals, z.infer<typeof codeSecteurParams>, EffectifsQuery>(async (req, { locals }) => {
      const ftOrga = locals.franceTravail;
      const code_secteur = Number(req.params.code_secteur);
      const { page, limit, search, sort, order, departements } = req.query;

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
    validateRequestMiddleware({ params: idParams, query: effectifFranceTravailQuerySchema }),
    returnResult(getEffectifById)
  );

  router.get(
    "/export/effectifs/:code_secteur",
    validateRequestMiddleware({ params: codeSecteurParams, query: exportQuery }),
    returnResult(exportEffectifByCodeSecteur)
  );

  router.get(
    "/export/effectifs-traites",
    validateRequestMiddleware({ query: exportTraitesQuery }),
    returnResult(exportEffectifsTraites)
  );

  router.put(
    "/effectif/:id",
    validateRequestMiddleware({ params: updateEffectifParams, body: updateEffectifBody }),
    returnResult(updateEffectifById)
  );

  return router;
};

const getArborescence: RouteHandler<FranceTravailLocals> = async (_req, { locals }) => {
  const ftOrga = locals.franceTravail;
  return getEffectifSecteurActivitesArboresence(ftOrga.code_region);
};

const getEffectifById: RouteHandler<
  FranceTravailLocals,
  z.infer<typeof idParams>,
  z.infer<typeof effectifFranceTravailQuerySchema>
> = async (req, { locals }) => {
  const ftOrga = locals.franceTravail;
  const { nom_liste, code_secteur, search, sort, order, mois, departements } = req.query;
  const effectifId = req.params.id;

  return await getEffectifFromFranceTravailId(ftOrga.code_region, code_secteur, effectifId, nom_liste, {
    search,
    sort,
    order,
    mois,
    departements,
  });
};

const updateEffectifById: RouteHandler<
  FranceTravailLocals,
  z.infer<typeof updateEffectifParams>,
  DefaultQuery,
  z.infer<typeof updateEffectifBody>
> = async (req) => {
  const effectifId = req.params.id;
  const user = req.user;
  const body = req.body;

  await updateFranceTravailData(effectifId, body.commentaire, body.situation, body.code_secteur, user._id);
};

const exportEffectifByCodeSecteur: RouteHandler<
  FranceTravailLocals,
  z.infer<typeof codeSecteurParams>,
  z.infer<typeof exportQuery>
> = async (req, res) => {
  const ftOrga = res.locals.franceTravail;
  const code_secteur = Number(req.params.code_secteur);
  const departements = req.query.departements;

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

  const columns: XlsxColumn[] = [
    { name: "Prénom", id: "prenom" },
    { name: "Nom", id: "nom" },
    { name: "RQTH", id: "rqth", transform: (d) => (d ? "OUI" : "NON") },
    { name: "Ville de résidence", id: "commune" },
    { name: "Age", id: "date_de_naissance", transform: (d) => getAgeFromDate(d as Date) },
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
    { name: "Date d'inscription", id: "date_inscription", transform: (d) => new Date(d as string) },
    {
      name: "Durée sans contrat /90j",
      id: "date_inscription",
      transform: (d) => {
        const diffTime = Math.abs(new Date().getTime() - new Date(d as string).getTime());
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

const exportEffectifsTraites: RouteHandler<
  FranceTravailLocals,
  DefaultParams,
  z.infer<typeof exportTraitesQuery>
> = async (req, res) => {
  const ftOrga = res.locals.franceTravail;
  const mois = req.query.mois;

  const fileName = mois
    ? `dossiers-traites-${mois}-${new Date().toISOString().split("T")[0]}.xlsx`
    : `dossiers-traites-${new Date().toISOString().split("T")[0]}.xlsx`;

  const columns: XlsxColumn[] = [
    { name: "Prénom", id: "prenom" },
    { name: "Nom", id: "nom" },
    { name: "RQTH", id: "rqth", transform: (d) => (d ? "OUI" : "NON") },
    { name: "Ville de résidence", id: "commune" },
    { name: "Age", id: "date_de_naissance", transform: (d) => getAgeFromDate(d as Date) },
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
    { name: "Date d'inscription", id: "date_inscription", transform: (d) => new Date(d as string) },
    { name: "Date de traitement", id: "date_traitement", transform: (d) => new Date(d as string) },
    {
      name: "Situation",
      id: "situation",
      transform: (d) =>
        typeof d === "string" ? FRANCE_TRAVAIL_SITUATION_LABELS[d as FranceTravailSituationKey] || d : "",
    },
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

const getEffectifsTraitesMois: RouteHandler<FranceTravailLocals> = async (_req, { locals }) => {
  const ftOrga = locals.franceTravail;
  return getFranceTravailEffectifsTraitesMois(ftOrga.code_region);
};

const getEffectifsTraitesParMois: RouteHandler<
  FranceTravailLocals,
  z.infer<typeof moisParams>,
  EffectifsQuery
> = async (req, { locals }) => {
  const ftOrga = locals.franceTravail;
  const { page, limit, search, sort, order, departements } = req.query;
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
