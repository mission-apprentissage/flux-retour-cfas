import { z } from "zod";

import { zApiEffectifListeEnum } from "../../data/missionLocaleEffectif.model";

export const effectifsParMoisFiltersMissionLocaleAPISchema = {
  type: z.array(zApiEffectifListeEnum),
  month: z
    .string()
    .regex(/^(\d{4}-\d{2}(-\d{2})?|plus-de-180-j)$/, "Month must be in format YYYY-MM, YYYY-MM-DD or 'plus-de-180-j'")
    .optional(),
};

export const effectifsParMoisFiltersMissionLocaleSchema = {
  type: zApiEffectifListeEnum,
  month: z
    .string()
    .regex(/^(\d{4}-\d{2}(-\d{2})?|plus-de-180-j)$/, "Month must be in format YYYY-MM, YYYY-MM-DD or 'plus-de-180-j'")
    .optional(),
};

export const effectifMissionLocaleListe = {
  nom_liste: zApiEffectifListeEnum,
};

export type IEffectifsParMoisFiltersMissionLocaleAPISchema = z.infer<
  z.ZodObject<typeof effectifsParMoisFiltersMissionLocaleAPISchema>
>;

export type IEffectifsParMoisFiltersMissionLocaleSchema = z.infer<
  z.ZodObject<typeof effectifsParMoisFiltersMissionLocaleSchema>
>;

/**
 * Feature "Inviter les CFA" (acquisition CFA via les Missions Locales).
 * Statut affiché par CFA dans la liste, relatif au conseiller ML connecté.
 */
export enum CFA_INVITATION_STATUT {
  // Aucune invitation envoyée par ce conseiller ; CFA éligible et contactable.
  INVITER = "INVITER",
  // Ce conseiller a déjà envoyé une invitation pour ce CFA.
  INVITATION_ENVOYEE = "INVITATION_ENVOYEE",
  // Le CFA a un compte actif sur le Tableau de bord.
  CFA_ACTIF = "CFA_ACTIF",
  // CFA non éligible techniquement ou sans email de contact connu : non invitable pour le moment.
  BIENTOT_DISPONIBLE = "BIENTOT_DISPONIBLE",
}

export interface ICfaToInvite {
  organisme_id: string;
  siret: string | null;
  uai: string | null;
  nom: string | null;
  adresse: string | null;
  nb_jeunes_rupture: number;
  statut: CFA_INVITATION_STATUT;
  // Nom complet du contact CFA s'il existe déjà dans usersMigration (sinon null → salutation générique)
  destinataire_nom: string | null;
  // Missions Locales actives de la région du CFA, affichées dans l'email d'invitation
  ml_partenaires: {
    count: number;
    noms: string[];
  };
}

export const inviteCfaMissionLocaleApi = {
  organisme_id: z.string(),
  note: z.string().trim().max(2000).optional(),
};

export type IInviteCfaMissionLocaleApi = z.infer<z.ZodObject<typeof inviteCfaMissionLocaleApi>>;
