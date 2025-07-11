import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import { IOrganisationMissionLocale } from "shared/models";
import { IMissionLocaleStats } from "shared/models/data/missionLocaleStats.model";
import { z } from "zod";

import { getMissionsLocalesByArml } from "@/common/actions/mission-locale/arml.actions";
import { getMissionLocaleStat } from "@/common/actions/mission-locale/mission-locale.actions";
import { getOrganisationById } from "@/common/actions/organisations.actions";
import { createTelechargementListeNomLog } from "@/common/actions/telechargementListeNomLogs.actions";
import { addSheetToXlscFile } from "@/common/utils/xlsxUtils";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();
  router.get("/mls", returnResult(getMissionLocales));
  router.get(
    "/mls/:mlId",
    validateRequestMiddleware({
      query: z.object({
        rqth_only: z.enum(["true", "false"]).optional(),
        mineur_only: z.enum(["true", "false"]).optional(),
      }),
    }),
    returnResult(getMissionLocale)
  );
  router.get("/export/mls", returnResult(exportMissionLocalesData));

  return router;
};

const getMissionLocales = async (_req, { locals }) => {
  const arml = locals.arml;
  const mlList = await getMissionsLocalesByArml(arml._id);
  return { arml, mlList };
};

const getMissionLocale = async ({ params, query }, { locals }) => {
  const mlId = params.mlId;
  const ml = (await getOrganisationById(new ObjectId(mlId))) as IOrganisationMissionLocale;

  if (!ml) {
    throw Boom.notFound("Mission locale not found");
  }

  if (ml.type !== "MISSION_LOCALE" || ml.arml_id?.toString() !== locals.arml._id.toString()) {
    throw Boom.forbidden("Mission locale does not belong to this ARML");
  }

  const rqth_only = query.rqth_only === "true";
  const mineur_only = query.mineur_only === "true";

  const mlStat = await getMissionLocaleStat(new ObjectId(mlId), ml.activated_at, mineur_only, rqth_only);

  return mlStat;
};

const exportMissionLocalesData = async (req, res) => {
  const arml = res.locals.arml;

  const date = new Date();

  const formatData = (
    mlData: Array<{
      _id: ObjectId;
      nom: string;
      code_postal: string;
      activated_at: Date;
      stats: IMissionLocaleStats["stats"];
    }>
  ) => {
    return mlData.map((ml) => {
      const stats = ml.stats || {};
      const total = stats.total || 0;
      const aTraiter = stats.a_traiter || 0;
      const traite = stats.traite || 0;
      const rdvPris = stats.rdv_pris || 0;
      const nouveauProjet = stats.nouveau_projet || 0;
      const dejaAccompagne = stats.deja_accompagne || 0;
      const sansReponse = stats.contacte_sans_retour || 0;
      const coordonnesIncorrectes = stats.coordonnees_incorrectes || 0;
      const autre = stats.autre || 0;
      const dejaConnu = stats.deja_connu || 0;

      return {
        _id: ml._id,
        nom: ml.nom,
        total,
        a_traiter: aTraiter,
        traites: traite,
        traites_pct: total ? ((traite / total) * 100).toFixed(2) : "0.00",
        rdv_pris: rdvPris,
        rdv_pris_pct: traite ? ((rdvPris / traite) * 100).toFixed(2) : "0.00",
        nouveau_projet: nouveauProjet,
        nouveau_projet_pct: traite ? ((nouveauProjet / traite) * 100).toFixed(2) : "0.00",
        deja_accompagne: dejaAccompagne,
        deja_accompagne_pct: traite ? ((dejaAccompagne / traite) * 100).toFixed(2) : "0.00",
        sans_reponse: sansReponse,
        sans_reponse_pct: traite ? ((sansReponse / traite) * 100).toFixed(2) : "0.00",
        coordonnes_incorrectes: coordonnesIncorrectes,
        coordonnes_incorrectes_pct: traite ? ((coordonnesIncorrectes / traite) * 100).toFixed(2) : "0.00",
        autre: autre,
        autre_pct: traite ? ((autre / traite) * 100).toFixed(2) : "0.00",
        deja_connu: dejaConnu,
        deja_connu_pct: traite ? ((dejaConnu / traite) * 100).toFixed(2) : "0.00",
      };
    });
  };
  const worksheetInfo = {
    worksheetName: "Missions Locales",
    logsTag: "arml" as const,
    data: formatData(await getMissionsLocalesByArml(arml._id)),
  };
  const fileName = `ARML_${date.toISOString().split("T")[0]}.xlsx`;

  const columns = [
    {
      name: "Mission Locale",
      id: "nom",
    },
    {
      name: "Total",
      id: "total",
    },
    {
      name: "A traiter",
      id: "a_traiter",
    },
    {
      name: "Traités",
      id: "traites",
    },
    {
      name: "Traités %",
      id: "traites_pct",
    },
    {
      name: "Rdv pris",
      id: "rdv_pris",
    },
    {
      name: "Rdv pris %",
      id: "rdv_pris_pct",
    },
    {
      name: "Nouveau projet",
      id: "nouveau_projet",
    },
    {
      name: "Nouveau projet %",
      id: "nouveau_projet_pct",
    },
    {
      name: "Déjà accompagné",
      id: "deja_accompagne",
    },
    {
      name: "Déjà accompagné %",
      id: "deja_accompagne_pct",
    },
    {
      name: "Sans réponse",
      id: "sans_reponse",
    },
    {
      name: "Sans réponse %",
      id: "sans_reponse_pct",
    },
    {
      name: "Coordonées incorrectes",
      id: "coordonnes_incorrectes",
    },
    {
      name: "Coordonées incorrectes %",
      id: "coordonnes_incorrectes_pct",
    },
    {
      name: "Autre",
      id: "autre",
    },
    {
      name: "Autre %",
      id: "autre_pct",
    },
    {
      name: "Déjà connu",
      id: "deja_connu",
    },
    {
      name: "Déjà connu %",
      id: "deja_connu_pct",
    },
  ];

  const templateFile = await addSheetToXlscFile("mission-locale/modele-arml.xlsx", [worksheetInfo], columns);
  res.attachment(fileName);
  res.contentType("xlsx");

  await createTelechargementListeNomLog(
    worksheetInfo.logsTag,
    worksheetInfo.data.map(({ _id }) => _id.toString()),
    date,
    req.user?._id,
    undefined,
    arml._id
  );

  const templateBuffer = await templateFile?.xlsx.writeBuffer();
  return templateBuffer;
};
