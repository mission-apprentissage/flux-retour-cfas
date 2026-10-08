import { z } from "zod";

const zCfaInvitationExportRow = z.object({
  date_invitation: z.date(),
  ml_nom: z.string().nullable(),
  region_ml: z.string(),
  siret_cfa: z.string(),
  raison_sociale_cfa: z.string().nullable(),
  region_cfa: z.string(),
  nb_nouveaux_comptes_apres_cfa: z.number(),
  date_derniere_connexion_cfa: z.date().nullable(),
  collab_apres_invitation_cfa: z.enum(["Oui", "Non"]),
  contacts_cfa_qui_ont_collabore: z.string(),
  nb_collab_apres_invitation_cfa: z.number(),
  date_premiere_collab_apres_cfa: z.date().nullable(),
  date_derniere_collab_cfa: z.date().nullable(),
  connexion_apres_invitation_cfa: z.enum(["Oui", "Non"]),
  date_premiere_connexion_apres_invitation_cfa: z.date().nullable(),
});

export type ICfaInvitationExportRow = z.output<typeof zCfaInvitationExportRow>;

export const zCfaInvitationsExportResponse = z.object({
  invitations: z.array(zCfaInvitationExportRow),
});

export type ICfaInvitationsExportResponse = z.output<typeof zCfaInvitationsExportResponse>;
