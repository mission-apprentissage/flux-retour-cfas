import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "decaRaw";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ statut: 1 }, {}],
  [{ "employeur.siret": 1 }, { unique: false }],
  [{ "formation.code_diplome": 1 }, { unique: false }],
  [{ created_at: 1 }, { unique: false }],
];

const zAdresse = z.object({
  code_postal: z.string(),
  numero: z.string().optional(),
  voie: z.string().optional(),
});

const zAlternant = z.object({
  date_naissance: z.date().describe("Date de naissance de l'alternant").nullish(),
  handicap: z.boolean(),
  nom: z.string(),
  prenom: z.string(),
  adresse: zAdresse,
  departement_naissance: z.string(),
  derniere_classe: z.number(),
  nationalite: z.number(),
  sexe: z.number(),
});

const zEmployeur = z.object({
  adresse: zAdresse.pick({ code_postal: true }),
  code_idcc: z.string(),
  denomination: z.string(),
  naf: z.string(),
  nombre_de_salaries: z.number(),
  siret: z.string(),
  telephone: z.string(),
});

const zFormation = z.object({
  code_diplome: z.string(),
  rncp: z.string(),
  intitule_ou_qualification: z.string(),
  type_diplome: z.string(),
  date_debut_formation: z.date().describe("Date de début de la formation").nullish(),
  date_fin_formation: z.date().describe("Date de fin de la formation").nullish(),
});

const zDecaRaw = z.object({
  _id: zObjectId.describe("Identifiant MongoDB de l'effectif"),
  rupture_avant_debut: z.boolean(),
  statut: z.string(),
  alternant: zAlternant,
  date_debut_contrat: z.date().describe("Date de début du contrat").nullish(),
  date_effet_rupture: z.date().describe("Date d'effet de la rupture du contrat").nullish(),
  date_fin_contrat: z.date().describe("Date de fin du contrat").nullish(),
  employeur: zEmployeur,
  flag_correction: z.boolean(),
  formation: zFormation,
  no_contrat: z.string(),
  organisme_formation: z.object({
    uai_cfa: z.string(),
    siret: z.string(),
  }),
  type_contrat: z.string(),
  dispositif: z.string(),
  etablissement_formation: z.object({}).passthrough(),
  created_at: z.date().describe("Date de création de l'enregistrement dans la base de données").nullish(),
  updated_at: z.date().describe("Date de dernière mise à jour de l'enregistrement dans la base de données").nullish(),
});

export type IDecaRaw = z.infer<typeof zDecaRaw>;

export default { zod: zDecaRaw, indexes, collectionName };
