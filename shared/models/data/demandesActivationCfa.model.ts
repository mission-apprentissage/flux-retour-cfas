import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "demandesActivationCfa";

const DOUZE_MOIS_EN_SECONDES = 365 * 24 * 3600;

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ created_at: 1 }, { name: "created_at_ttl", expireAfterSeconds: DOUZE_MOIS_EN_SECONDES }],
  [
    { email: 1, siret_saisi: 1 },
    { name: "email_siret_saisi", unique: true },
  ],
  [{ user_id: 1 }, { name: "user_id" }],
];

export const MOTIFS_DEMANDE_ACTIVATION = {
  aucun_effectif: { libelle: "Aucun apprenti sur les années actives", avecMail: true },
  siret_inconnu: { libelle: "SIRET inconnu du TBA", avecMail: true },
  sans_uai: { libelle: "Établissement sans UAI", avecMail: true },
  siret_mal_forme: { libelle: "SIRET mal formé", avecMail: false },
  email_mal_forme: { libelle: "Email mal formé", avecMail: false },
  messagerie_grand_public: { libelle: "Messagerie grand public", avecMail: false },
  responsable_pur: { libelle: "Organisme responsable sans formation en propre", avecMail: false },
  nature_inconnue: { libelle: "Nature de l'organisme inconnue", avecMail: false },
  compte_autre_organisation: { libelle: "Compte rattaché à une autre organisation", avecMail: false },
  ferme: { libelle: "Établissement fermé", avecMail: false },
  refus_force: { libelle: "Refus forcé par l'équipe", avecMail: false },
} as const;

export type MotifDemandeActivation = keyof typeof MOTIFS_DEMANDE_ACTIVATION;

export const MOTIFS_LEVES_PAR_BRANCHE_FORCEE: ReadonlyArray<MotifDemandeActivation> = [
  "messagerie_grand_public",
  "aucun_effectif",
];

export const zBrancheDemandeActivation = z.enum(["activation", "compte_existant", "refus"]);
export const zStatutDemandeActivation = z.enum(["pret", "envoi_en_cours", "envoyee", "echec", "invitation_expiree"]);
const zMotifDemandeActivation = z.enum(
  Object.keys(MOTIFS_DEMANDE_ACTIVATION) as [MotifDemandeActivation, ...MotifDemandeActivation[]]
);

const zDemandeActivationCfa = z.object({
  _id: zObjectId,
  source: z.string({ description: "Nom de la source saisi à l'import (informatif)" }),
  horodatage_brut: z.string({ description: "Horodateur du formulaire, tel quel" }).nullish(),
  horodatage: z.date({ description: "Horodateur du formulaire, lu" }).nullish(),
  email: z.string({ description: "Email du demandeur, en minuscules et sans espaces" }),
  fonction: z.string({ description: "Fonction déclarée dans le formulaire" }).nullish(),
  siret_saisi_brut: z.string({ description: "SIRET saisi dans le formulaire, tel quel" }),
  siret_saisi: z.string({ description: "SIRET saisi, réduit à ses chiffres" }),
  commentaire: z.string({ description: "Questions ou remarques du formulaire" }).nullish(),
  siret_corrige: z.string({ description: "SIRET corrigé par l'équipe" }).nullish(),
  branche_forcee: zBrancheDemandeActivation.nullish().describe("Branche forcée par l'équipe"),
  siret: z.string({ description: "SIRET retenu" }).nullish(),
  uai: z.string({ description: "UAI retenu" }).nullish(),
  siret_propose: z.string({ description: "SIRET ouvert de même UAI, proposé quand le SIRET est fermé" }).nullish(),
  organisme_id: zObjectId.nullish().describe("Organisme retenu"),
  organisation_id: zObjectId.nullish().describe("Organisation de l'organisme retenu"),
  user_id: zObjectId.nullish().describe("Compte trouvé pour l'email du demandeur"),
  effectifs_erp: z.number({ description: "Effectifs ERP sur les années actives" }).nullish(),
  effectifs_deca: z.number({ description: "Effectifs DECA sur les années actives" }).nullish(),
  motifs: z.array(zMotifDemandeActivation).describe("Motifs de refus"),
  domaine_inconnu: z.boolean({ description: "Domaine de l'email jamais vu dans le TBA (avertissement)" }),
  branche: zBrancheDemandeActivation,
  branche_initiale: zBrancheDemandeActivation.describe("Branche de la première évaluation"),
  branche_envoyee: zBrancheDemandeActivation.nullish().describe("Branche du dernier envoi"),
  evalue_at: z.date({ description: "Date de la dernière évaluation" }),
  a_envoyer: z.boolean({ description: "Ligne cochée pour l'envoi" }),
  statut: zStatutDemandeActivation,
  motif_echec: z.string({ description: "Motif du dernier échec d'envoi" }).nullish(),
  envoye_par_id: zObjectId.nullish().describe("Admin TBA qui a lancé le dernier envoi"),
  envoye_par_email: z.string({ description: "Email de l'admin TBA qui a lancé le dernier envoi" }).nullish(),
  envoi_en_cours_at: z.date({ description: "Date de mise en file du dernier envoi" }).nullish(),
  envoyee_at: z.date({ description: "Date du dernier envoi réussi" }).nullish(),
  invitation_id: zObjectId.nullish().describe("Invitation admin créée ou reprise par l'envoi"),
  invitez_queued_at: z.date({ description: "Mise en file de l'email « invitez vos collaborateurs »" }).nullish(),
  invitez_sent_at: z.date({ description: "Envoi de l'email « invitez vos collaborateurs »" }).nullish(),
  relance_sans_compte_at: z.date({ description: "Relance de l'admin sans compte à J+7" }).nullish(),
  relance_validation_email_at: z.date({ description: "Renvoi de la validation d'email à J+2" }).nullish(),
  relance_avec_compte_at: z.date({ description: "Relance de l'admin avec compte à J+7" }).nullish(),
  relance_sans_invitation_at: z.date({ description: "Relance de l'admin qui n'a invité personne" }).nullish(),
  etapes: z
    .object({
      flag_at: z.date().nullish(),
      compte_at: z.date().nullish(),
      invitation_at: z.date().nullish(),
      email_at: z.date().nullish(),
    })
    .nullish()
    .describe("Étapes de l'envoi déjà faites"),
  created_at: z.date(),
  updated_at: z.date(),
});

export type IDemandeActivationCfa = z.output<typeof zDemandeActivationCfa>;
export type BrancheDemandeActivation = z.output<typeof zBrancheDemandeActivation>;
export type StatutDemandeActivation = z.output<typeof zStatutDemandeActivation>;

export default { zod: zDemandeActivationCfa, indexes, collectionName };
