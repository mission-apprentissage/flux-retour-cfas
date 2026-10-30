import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "demandesActivationCfa";

const DOUZE_MOIS_EN_SECONDES = 365 * 24 * 3600;

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ created_at: 1 }, { name: "created_at_ttl", expireAfterSeconds: DOUZE_MOIS_EN_SECONDES }],
  [
    { email_saisi: 1, siret_saisi: 1 },
    { name: "email_saisi_siret_saisi", unique: true },
  ],
];

export const MOTIFS_DEMANDE_ACTIVATION = {
  aucun_effectif: {
    libelle: "Aucun apprenti sur les années actives",
    detail: "Aucun effectif ERP ni DECA sur les années scolaires actives",
    avecMail: true,
  },
  siret_inconnu: {
    libelle: "SIRET inconnu du TBA",
    detail: "Aucun établissement de ce SIRET dans le Tableau de bord",
    avecMail: true,
  },
  sans_uai: {
    libelle: "Établissement sans UAI",
    detail: "L'établissement n'a pas d'UAI : DECA ne peut pas lui être ouvert",
    avecMail: true,
  },
  siret_mal_forme: {
    libelle: "SIRET mal formé",
    detail: "Le SIRET saisi n'a pas 14 chiffres : corrigez-le",
    avecMail: false,
  },
  email_mal_forme: {
    libelle: "Email mal formé",
    detail: "L'adresse saisie n'est pas un email valide",
    avecMail: false,
  },
  messagerie_grand_public: {
    libelle: "Messagerie grand public",
    detail: "Adresse Gmail, Orange… : corrigez-la avec l'adresse professionnelle du CFA",
    avecMail: false,
  },
  responsable_pur: {
    libelle: "Organisme responsable sans formation en propre",
    detail: "Organisme de nature « responsable » : il ne forme pas lui-même",
    avecMail: false,
  },
  nature_inconnue: {
    libelle: "Nature de l'organisme inconnue",
    detail: "La nature de l'organisme est inconnue du référentiel",
    avecMail: false,
  },
  compte_autre_organisation: {
    libelle: "Compte rattaché à une autre organisation",
    detail: "Cet email a déjà un compte dans une autre organisation",
    avecMail: false,
  },
  ferme: {
    libelle: "Établissement fermé",
    detail: "Le SIRET saisi est fermé : corrigez-le avec le SIRET ouvert de même UAI s'il est proposé",
    avecMail: false,
  },
} as const;

export type MotifDemandeActivation = keyof typeof MOTIFS_DEMANDE_ACTIVATION;

export const refusAvecMail = (motifs: ReadonlyArray<MotifDemandeActivation>) =>
  motifs.every((motif) => MOTIFS_DEMANDE_ACTIVATION[motif].avecMail);

export const zBrancheDemandeActivation = z.enum(["activation", "compte_existant", "refus"]);
const zStatutDemandeActivation = z.enum(["pret", "envoi_en_cours", "envoyee", "echec", "invitation_expiree"]);
const zMotifDemandeActivation = z.enum(
  Object.keys(MOTIFS_DEMANDE_ACTIVATION) as [MotifDemandeActivation, ...MotifDemandeActivation[]]
);

const zDemandeActivationCfa = z.object({
  _id: zObjectId,
  source: z.string({ description: "Nom de la source saisi à l'import (informatif)" }),
  horodatage_brut: z.string({ description: "Horodateur du formulaire, tel quel" }).nullish(),
  horodatage: z.date({ description: "Horodateur du formulaire, lu" }).nullish(),
  email_saisi: z.string({ description: "Email saisi dans le formulaire, en minuscules et sans espaces" }),
  email_corrige: z.string({ description: "Email corrigé par l'équipe" }).nullish(),
  email: z.string({ description: "Email retenu : corrigé, sinon saisi" }),
  fonction: z.string({ description: "Fonction déclarée dans le formulaire" }).nullish(),
  siret_saisi_brut: z.string({ description: "SIRET saisi dans le formulaire, tel quel" }),
  siret_saisi: z.string({ description: "SIRET saisi, réduit à ses chiffres" }),
  commentaire: z.string({ description: "Questions ou remarques du formulaire" }).nullish(),
  siret_corrige: z.string({ description: "SIRET corrigé par l'équipe" }).nullish(),
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

export const estRenvoyable = (statut: StatutDemandeActivation) => statut === "echec" || statut === "invitation_expiree";

export default { zod: zDemandeActivationCfa, indexes, collectionName };
