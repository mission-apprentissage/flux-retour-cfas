import Boom from "boom";
import express from "express";
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
  getEffectifFromFranceTravailId,
  getEffectifSecteurActivitesArboresence,
  getFranceTravailEffectifsByCodeSecteur,
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
    "/effectifs/traite",
    validateRequestMiddleware({
      query: franceTravailEffectifsQuerySchema,
    }),
    returnResult(getEffectifsTraites)
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
      const { page, limit, search, sort, order } = req.query as IFranceTravailEffectifsQuery;

      return getFranceTravailEffectifsByCodeSecteur(ftOrga.code_region, API_EFFECTIF_LISTE.A_TRAITER, code_secteur, {
        page,
        limit,
        search,
        sort,
        order,
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
    }),
    returnResult(exportEffectifByCodeSecteur)
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

const getEffectifsTraites = async (req, { locals }) => {
  const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
  const { page, limit, search, sort, order } = req.query as IFranceTravailEffectifsQuery;

  return getFranceTravailEffectifsByCodeSecteur(ftOrga.code_region, API_EFFECTIF_LISTE.TRAITE, undefined, {
    page,
    limit,
    search,
    sort,
    order,
  });
};

const getEffectifById = async (req, { locals }) => {
  const ftOrga = locals.franceTravail as IOrganisationFranceTravail;
  const { nom_liste, code_secteur, search, sort, order } = req.query as IEffectifFranceTravailQuery;
  const effectifId = req.params.id;

  return await getEffectifFromFranceTravailId(ftOrga.code_region, code_secteur, effectifId, nom_liste, {
    search,
    sort,
    order,
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
  const secteurActivite = await getSecteurActivitesByCode(code_secteur);

  if (!secteurActivite) {
    throw Boom.notFound("Secteur d'activité introuvable");
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
      worksheetName: `A traiter - ${secteurActivite.libelle_secteur}`,
      logsTag: `ft_a_traiter` as const,
      data: await getAllFranceTravailEffectifsByCodeSecteur(ftOrga.code_region, code_secteur),
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
