import Boom from "boom";
import { format } from "date-fns";
import express from "express";
import { Parser } from "json2csv";
import { ObjectId } from "mongodb";
import { ACADEMIES_DEPARTEMENT_MAP, ORGANISATION_TYPE } from "shared/constants";
import { IOrganisationOperateurPublicAcademie, IOrganisationOperateurPublicRegion } from "shared/models";
import { z } from "zod";

import {
  getAffelnetCountVoeuxNational,
  getAffelnetVoeuxConcretise,
  getAffelnetVoeuxNonConcretise,
} from "@/common/actions/affelnet.actions";
import { createTelechargementListeNomLog } from "@/common/actions/telechargementListeNomLogs.actions";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { requireOrganismeRegional, returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const AFFELNET_FIELDS = [
  { label: "INE", value: "ine" },
  { label: "Nom", value: "nom" },
  { label: "Prenom 1", value: "prenom_1" },
  { label: "Prenom 2", value: "prenom_2" },
  { label: "Prenom 3", value: "prenom_3" },
  { label: "Adresse 1", value: "adresse_1" },
  { label: "Adresse 2", value: "adresse_2" },
  { label: "Adresse 3", value: "adresse_3" },
  { label: "Adresse 4", value: "adresse_4" },
  { label: "Code Postal", value: "code_postal" },
  { label: "Ville", value: "ville" },
  { label: "Pays", value: "pays" },
  { label: "Mail Responsable 1", value: "mail_responsable_1" },
  { label: "Mail Responsable 2", value: "mail_responsable_2" },
  { label: "Telephone Responsable 1", value: "telephone_responsable_1" },
  { label: "Telephone Responsable 2", value: "telephone_responsable_2" },
  { label: "Ville Etab Origine", value: "ville_etab_origine" },
  { label: "Type Etab Origine", value: "type_etab_origine" },
  { label: "Libelle Etab Origine", value: "libelle_etab_origine" },
  { label: "Nombre Voeux", value: "nombre_voeux" },
  { label: "Formation(s) demandée(s)", value: "formations_demandees" },
  { label: "Uai Etab Formateur", value: "uai_etablissement_formateur" },
  { label: "Uai Etab Responsable", value: "uai_etablissement_responsable" },
  { label: "Uai Cio Etab Accueil", value: "uai_cio_etablissement_accueil" },
  { label: "Type Etab Accueil", value: "type_etablissement_accueil" },
  { label: "Libelle Public Etab Accueil", value: "libelle_pulic_etablissement_accueil" },
  { label: "Contrat signé (CFA)", value: "contrat_signe" },
  { label: "Contrat signé (DECA)", value: "contrat_deca_signe" },
];

const computeFields = (data) => {
  const maxContrats = Math.max(...data.map((d) => (d.contrats ? d.contrats.length : 0)));
  const extraFields: Array<{ label: string; value: string }> = [];
  for (let i = 0; i < maxContrats; i++) {
    extraFields.push({ label: `Date début contrat ${i + 1}`, value: `date_debut_contrat_${i + 1}` });
    extraFields.push({ label: `Date fin contrat ${i + 1}`, value: `date_fin_contrat_${i + 1}` });
  }

  const maxContratsDeca = Math.max(...data.map((d) => (d.contrats_deca ? d.contrats_deca.length : 0)));
  const extraFieldsDeca: Array<{ label: string; value: string }> = [];
  for (let i = 0; i < maxContratsDeca; i++) {
    extraFieldsDeca.push({ label: `Date début contrat DECA ${i + 1}`, value: `deca_date_debut_contrat_${i + 1}` });
    extraFieldsDeca.push({ label: `Date fin contrat DECA ${i + 1}`, value: `deca_date_fin_contrat_${i + 1}` });
  }

  return [...AFFELNET_FIELDS, ...extraFields, ...extraFieldsDeca];
};

const getRegionAndDepartementFromOrganisation = (
  orga: IOrganisationOperateurPublicRegion | IOrganisationOperateurPublicAcademie,
  organisme_departements
) => {
  const handleDreetsAndDrafpic = (organisation: IOrganisationOperateurPublicRegion) => {
    return { organismes_regions: organisation.code_region ? [organisation.code_region] : [], organisme_departements };
  };

  const handleAcademie = (organisation: IOrganisationOperateurPublicAcademie) => {
    return {
      organismes_regions: null,
      organisme_departements: organisme_departements ?? ACADEMIES_DEPARTEMENT_MAP[organisation.code_academie],
    };
  };

  switch (orga.type) {
    case ORGANISATION_TYPE.DREETS:
    case ORGANISATION_TYPE.DRAFPIC:
      return handleDreetsAndDrafpic(orga as IOrganisationOperateurPublicRegion);
    case ORGANISATION_TYPE.ACADEMIE:
      return handleAcademie(orga as IOrganisationOperateurPublicAcademie);
    default:
      return { organismes_regions: null, organisme_departements: null };
  }
};

export default () => {
  const router = express.Router();

  router.get(
    "/national/count",
    requireOrganismeRegional,
    validateRequestMiddleware({
      query: z.object({
        organisme_departements: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
        year: z.string().optional(),
      }),
    }),
    returnResult(getNationalCount)
  );

  router.get(
    "/export/concretise",
    requireOrganismeRegional,
    validateRequestMiddleware({
      query: z.object({
        organisme_departements: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
        year: z.string().optional(),
      }),
    }),
    returnResult(async (req, res) => {
      const affelnetCsv = await exportConcretisee(req);
      res.attachment(`voeux_affelnet_concretisee.csv`);
      return affelnetCsv;
    })
  );

  router.get(
    "/export/non-concretise",
    requireOrganismeRegional,
    validateRequestMiddleware({
      query: z.object({
        organisme_departements: z.preprocess((str: any) => str.split(","), z.array(z.string())).optional(),
        year: z.string().optional(),
      }),
    }),
    returnResult(async (req, res) => {
      const affelnetCsv = await exportNonConcretisee(req);
      res.attachment(`voeux_affelnet_non_concretisee.csv`);
      return affelnetCsv;
    })
  );

  return router;
};

const getNationalCount = async (req) => {
  const user = req.user as AuthContext;
  const { organisme_departements, year } = req.query;

  if (!year) {
    throw Boom.badRequest("Year is required");
  }

  const orga = user.organisation as IOrganisationOperateurPublicRegion | IOrganisationOperateurPublicAcademie;
  const result = getRegionAndDepartementFromOrganisation(orga, organisme_departements);
  return await getAffelnetCountVoeuxNational(result.organisme_departements, result.organismes_regions, year);
};

const exportNonConcretisee = async (req) => {
  const user = req.user as AuthContext;
  const { organisme_departements, year } = req.query;

  if (!year) {
    throw Boom.badRequest("Year is required");
  }

  const orga = user.organisation as IOrganisationOperateurPublicRegion | IOrganisationOperateurPublicAcademie;
  const results = getRegionAndDepartementFromOrganisation(orga, organisme_departements);
  const listVoeux = await getAffelnetVoeuxNonConcretise(
    results.organisme_departements,
    results.organismes_regions,
    year
  );

  const transformedVoeux = listVoeux.map(({ contrats = [], contrats_deca = [], formations_demandees, ...voeu }) => ({
    ...voeu,
    formations_demandees: formations_demandees.join(", "),
    contrat_signe: contrats && contrats.length ? "Oui" : "Non",
    contrat_deca_signe: contrats_deca && contrats_deca.length ? "Oui" : "Non",
    ...contrats.reduce((acc, curr, index) => {
      return {
        ...acc,
        [`date_debut_contrat_${index + 1}`]: format(new Date(curr.date_debut_contrat), "dd/MM/yyyy"),
        [`date_fin_contrat_${index + 1}`]: format(new Date(curr.date_fin_contrat), "dd/MM/yyyy"),
      };
    }, {}),
    ...contrats_deca.reduce((acc, curr, index) => {
      return {
        ...acc,
        [`deca_date_debut_contrat_${index + 1}`]: format(new Date(curr.date_debut_contrat), "dd/MM/yyyy"),
        [`deca_date_fin_contrat_${index + 1}`]: format(new Date(curr.date_fin_contrat), "dd/MM/yyyy"),
      };
    }, {}),
  }));

  const ids = listVoeux.map((voeu) => voeu._id);
  await createTelechargementListeNomLog(
    "affelnet_non_concretise",
    ids,
    new Date(),
    req.user._id,
    undefined,
    new ObjectId(orga._id)
  );

  const json2csvParser = new Parser({ fields: computeFields(listVoeux), delimiter: ";", withBOM: true });
  const csv = await json2csvParser.parse(transformedVoeux);

  return csv;
};

const exportConcretisee = async (req) => {
  const user = req.user as AuthContext;
  const { organisme_departements, year } = req.query;

  if (!year) {
    throw Boom.badRequest("Year is required");
  }

  const orga = user.organisation as IOrganisationOperateurPublicRegion | IOrganisationOperateurPublicAcademie;
  const results = getRegionAndDepartementFromOrganisation(orga, organisme_departements);
  const listVoeux = await getAffelnetVoeuxConcretise(results.organisme_departements, results.organismes_regions, year);

  const transformedVoeux = listVoeux.map(({ contrats = [], formations_demandees, ...voeu }) => ({
    ...voeu,
    formations_demandees: formations_demandees.join(", "),
    contrat_signe: contrats && contrats.length ? "Oui" : "Non",
    ...contrats.reduce((acc, curr, index) => {
      return {
        ...acc,
        [`date_debut_contrat_${index + 1}`]: format(new Date(curr.date_debut), "dd/MM/yyyy"),
        [`date_fin_contrat_${index + 1}`]: format(new Date(curr.date_fin), "dd/MM/yyyy"),
      };
    }, {}),
  }));

  const ids = listVoeux.map((voeu) => voeu._id);
  await createTelechargementListeNomLog(
    "affelnet_concretise",
    ids,
    new Date(),
    req.user._id,
    undefined,
    new ObjectId(orga._id)
  );

  const json2csvParser = new Parser({ fields: computeFields(listVoeux), delimiter: ";", withBOM: true });
  const csv = await json2csvParser.parse(transformedVoeux);

  return csv;
};
