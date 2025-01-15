import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

// Address schema
const zAdresse = z.object({
  voie: z.string().optional(),
  code_postal: z.string(),
  numero: z.string().optional(),
});

// Alternant schema
const zAlternant = z.object({
  nom: z.string(),
  prenom: z.string(),
  sexe: z.string(),
  date_naissance: z.string().describe("Date de naissance de l'alternant").nullish(),
  departement_naissance: z.string(),
  nationalite: z.number(),
  handicap: z.boolean(),
  courriel: z.string(),
  telephone: z.string(),
  adresse: zAdresse,
  derniere_classe: z.number(),
});

// Employeur schema
const zEmployeur = z.object({
  siret: z.string(),
  denomination: z.string(),
  adresse: zAdresse.pick({ code_postal: true }),
  naf: z.string(),
  code_idcc: z.string(),
  nombre_de_salaries: z.number(),
  courriel: z.string().optional(),
  telephone: z.string().optional(),
});

// Formation schema
const zFormation = z.object({
  code_diplome: z.string(),
  rncp: z.string(),
  intitule_ou_qualification: z.string(),
  type_diplome: z.string(),
  date_debut_formation: z.string().describe("Date de début de la formation").nullish(),
  date_fin_formation: z.string().describe("Date de fin de la formation").nullish(),
});

// Organisme formation schema
const zOrganismeFormation = z.object({
  siret: z.string(),
  uai_cfa: z.string(),
});

// Main schema for the airbyte data
const zRawBalDeca = z.object({
  _id: zObjectId,
  no_contrat: z.string(),
  type_contrat: z.string(),
  alternant: zAlternant,
  date_debut_contrat: z.string().describe("Date de début du contrat").nullish(),
  date_fin_contrat: z.string().describe("Date de fin du contrat").nullish(),
  date_effet_rupture: z.string().describe("Date d'effet de la rupture du contrat").nullish(),
  dispositif: z.string(),
  employeur: zEmployeur,
  organisme_formation: zOrganismeFormation,
  formation: zFormation,
  created_at: z.string().describe("Date de création de l'enregistrement dans la base de données").nullish(),
  updated_at: z.string().describe("Date de dernière mise à jour de l'enregistrement dans la base de données").nullish(),
  _ab_cdc_updated_at: z.string().optional(),
  _ab_cdc_cursor: z
    .object({
      $numberLong: z.string(),
    })
    .optional(),
  _ab_cdc_deleted_at: z.null().optional(),
});

// Define the type
export type IRawBalDeca = z.infer<typeof zRawBalDeca>;
