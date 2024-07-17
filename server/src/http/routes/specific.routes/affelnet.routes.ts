import express from "express";
import { Parser } from "json2csv";
import { ObjectId } from "mongodb";
import { IOrganisationOperateurPublicRegion } from "shared/models";
import { z } from "zod";

import { getAffelnetCountVoeuxNational, getAffelnetVoeuxNonConcretise } from "@/common/actions/affelnet.actions";
import { createTelechargementListeNomLog } from "@/common/actions/telechargementListeNomLogs.actions";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { requireOrganismeRegional, returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const AFFELNET_FIELDS = [
  { label: "Nom", value: "nom" },
  { label: "Prenom 1", value: "prenom_1" },
  { label: "Prenom 2", value: "prenom_2" },
  { label: "Prenom 3", value: "prenom_3" },
  { label: "Mail Responsable 1", value: "mail_responsable_1" },
  { label: "Mail Responsable 2", value: "mail_responsable_2" },
  { label: "Telephone Responsable 1", value: "telephone_responsable_1" },
  { label: "Telephone Responsable 2", value: "telephone_responsable_2" },
  { label: "Ville Etab Origine", value: "ville_etab_origine" },
  { label: "Type Etab Origine", value: "type_etab_origine" },
  { label: "Libelle Etab Origine", value: "libelle_etab_origine" },
  { label: "Nombre Voeux", value: "nombre_voeux" },
];

export default () => {
  const router = express.Router();

  router.get(
    "/national/count",
    requireOrganismeRegional,
    validateRequestMiddleware({
      query: z.object({
        organisme_departements: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
      }),
    }),
    returnResult(getNationalCount)
  );

  router.get(
    "/export/non-concretise",
    requireOrganismeRegional,
    validateRequestMiddleware({
      query: z.object({
        organisme_departements: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
      }),
    }),
    returnResult(async (req, res) => {
      const affelnetCsv = await exportNonConretisee(req);
      res.attachment(`voeux_affelnet_non_concretisee.csv`);
      return affelnetCsv;
    })
  );

  return router;
};

const getNationalCount = async (req) => {
  const user = req.user as AuthContext;
  const orga = user.organisation as IOrganisationOperateurPublicRegion;
  const organismes_regions = orga.code_region ? [orga.code_region] : [];
  const { organisme_departements } = req.query;
  return await getAffelnetCountVoeuxNational(organisme_departements, organismes_regions);
};

const exportNonConretisee = async (req) => {
  const user = req.user as AuthContext;
  const orga = user.organisation as IOrganisationOperateurPublicRegion;
  const organismes_regions = orga.code_region ? [orga.code_region] : [];
  const { organisme_departements } = req.query;
  const listVoeux = await getAffelnetVoeuxNonConcretise(organisme_departements, organismes_regions);

  const ids = listVoeux.map((voeu) => voeu._id);
  await createTelechargementListeNomLog("affelnet", ids, new Date(), req.user._id, undefined, new ObjectId(orga._id));

  const json2csvParser = new Parser({ fields: AFFELNET_FIELDS, delimiter: ";", withBOM: true });
  const csv = await json2csvParser.parse(listVoeux);

  return csv;
};
