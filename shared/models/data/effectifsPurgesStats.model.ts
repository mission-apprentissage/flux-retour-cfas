import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "effectifsPurgesStats";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [
    { organisme_id: 1, uai: 1, siret: 1, annee_scolaire: 1, source: 1, statut: 1, niveau: 1 },
    { unique: true, name: "dimensions" },
  ],
];

export const zEffectifsPurgesStats = z.object({
  _id: zObjectId,
  organisme_id: zObjectId.describe("Organisme du dossier supprimé"),
  uai: z.string().nullable().describe("UAI de l'organisme au moment de la suppression"),
  siret: z.string().nullable().describe("SIRET de l'organisme au moment de la suppression"),
  annee_scolaire: z.string().describe("Année scolaire du dossier supprimé"),
  source: z.string().describe("ERP, FICHIER ou DECA"),
  statut: z.string().nullable().describe("Statut en cours du dossier au moment de la suppression"),
  niveau: z.string().nullable().describe("Niveau de formation du dossier"),
  nombre: z.number().int().describe("Nombre de dossiers supprimés pour ces dimensions"),
  updated_at: z.date().describe("Date du dernier ajout"),
});

export type IEffectifsPurgesStats = z.output<typeof zEffectifsPurgesStats>;

export default { zod: zEffectifsPurgesStats, indexes, collectionName };
