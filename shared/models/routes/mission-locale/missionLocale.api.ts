import { z } from "zod";

import { zMlSituationDossier, zMlTriColonne, zMlTriOrdre } from "../../../constants/missionLocale";
import { API_EFFECTIF_LISTE, zApiEffectifListeEnum, zSituationEnum } from "../../data/missionLocaleEffectif.model";

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
  // Filtre villes (codes postaux séparés par des virgules) pour restreindre le calcul précédent/suivant.
  code_postal: z.string().optional(),
  // Tri de la liste d'origine, pour que le précédent/suivant suive l'ordre affiché.
  tri: zMlTriColonne.optional(),
  ordre: zMlTriOrdre.optional(),
};

/** Listes plates de l'espace ML : dossiers prioritaires et collaborations CFA. */
export const zNomListeFusionnee = z.enum([
  API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER,
  API_EFFECTIF_LISTE.COLLAB_A_TRAITER_OU_RECONTACTER,
  API_EFFECTIF_LISTE.COLLAB_TRAITE,
]);

export const effectifsFusionnesQuerySchema = {
  nom_liste: zNomListeFusionnee,
  tri: zMlTriColonne.optional(),
  ordre: zMlTriOrdre.optional(),
};

export const zMissionLocaleEffectifListItem = z.object({
  id: z.string(),
  nom: z.string().nullish(),
  prenom: z.string().nullish(),
  libelle_formation: z.string().nullish(),
  commune: z.string().nullish(),
  code_postal: z.string().nullish(),
  organisme_nom: z.string().nullish(),
  organisme_raison_sociale: z.string().nullish(),
  organisme_enseigne: z.string().nullish(),
  prioritaire: z.boolean().nullish(),
  date_rupture: z.date().nullish(),
  a_traiter: z.boolean(),
  injoignable: z.boolean(),
  nouveau_contrat: z.boolean().nullish(),
  mineur: z.boolean().nullish(),
  acc_conjoint: z.boolean().nullish(),
  rqth: z.boolean().nullish(),
  whatsapp_callback_requested: z.boolean(),
  whatsapp_no_help_responded: z.boolean(),
  souhaite_rdv: z.boolean(),
  situation: zSituationEnum.nullish(),
  situation_dossier: zMlSituationDossier.nullish(),
  relance_urgente: z.boolean(),
  date_reception: z.date().nullish(),
  date_traitement: z.date().nullish(),
  date_dernier_passage_a_recontacter: z.date().nullish(),
  date_derniere_action_ml: z.date().nullish(),
});

export const zEffectifsFusionnesResponse = z.object({
  effectifs: z.array(zMissionLocaleEffectifListItem),
  counts: z.object({
    a_traiter_ou_recontacter: z.number(),
    traite: z.number(),
  }),
});

export type INomListeFusionnee = z.infer<typeof zNomListeFusionnee>;
export type IMissionLocaleEffectifListItem = z.infer<typeof zMissionLocaleEffectifListItem>;
export type IEffectifsFusionnesResponse = z.infer<typeof zEffectifsFusionnesResponse>;

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
  // Le CFA a activé la collaboration de lui-même.
  CFA_ACTIF = "CFA_ACTIF",
  // Le CFA a activé la collaboration après une invitation de ce conseiller.
  CFA_ACTIF_APRES_INVITATION = "CFA_ACTIF_APRES_INVITATION",
}

export interface ICfaToInvite {
  organisme_id: string;
  siret: string | null;
  uai: string | null;
  nom: string | null;
  adresse: string | null;
  // Périmètre de cette ML : sert au tri de la liste et à l'aperçu de l'email.
  nb_jeunes_rupture: number;
  // Toutes ML confondues : c'est le chiffre que le CFA lira dans l'email.
  nb_jeunes_rupture_etablissement: number;
  statut: CFA_INVITATION_STATUT;
  // Nombre de comptes TBA du CFA qui recevront l'invitation
  nb_destinataires: number;
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
