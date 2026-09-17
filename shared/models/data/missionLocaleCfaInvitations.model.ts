import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "missionLocaleCfaInvitations";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  // Statut "Invitation envoyée" relatif au conseiller connecté (badge par utilisateur ML)
  [{ mission_locale_id: 1, author_id: 1, organisme_id: 1 }, { name: "ml_author_organisme" }],
  // Récupération de toutes les invitations envoyées pour un CFA donné
  [{ organisme_id: 1 }, { name: "organisme" }],
];

const zMissionLocaleCfaInvitation = z.object({
  _id: zObjectId,
  mission_locale_id: zObjectId.describe("Organisation MISSION_LOCALE émettrice (organisations._id)"),
  author_id: zObjectId.describe("Utilisateur ML ayant déclenché l'invitation (usersMigration._id)"),
  organisme_id: zObjectId.describe("CFA cible issu du référentiel (organismes._id)"),
  organisation_id: zObjectId.describe("Organisation ORGANISME_FORMATION liée (= invitations.organisation_id)"),
  siret: z.string().describe("SIRET du CFA au moment de l'envoi (dénormalisé pour traçabilité)"),
  uai: z.string().nullish().describe("UAI du CFA au moment de l'envoi (dénormalisé)"),
  destinataires: z
    .array(z.object({ user_id: zObjectId, email: z.string() }))
    .describe("Comptes TBA du CFA auxquels l'invitation a effectivement été envoyée"),
  note: z.string().nullish().describe("Note de recommandation facultative rédigée par le conseiller"),
  cc_email: z.string().nullish().describe("Email du conseiller mis en copie de l'invitation"),
  created_at: z.date({ description: "Date de création en base de données" }),
});

export type IMissionLocaleCfaInvitation = z.output<typeof zMissionLocaleCfaInvitation>;

export default { zod: zMissionLocaleCfaInvitation, indexes, collectionName };
