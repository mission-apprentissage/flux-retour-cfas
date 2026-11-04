import {
  BrancheDemandeActivation,
  refusAvecMail,
  StatutDemandeActivation,
} from "shared/models/data/demandesActivationCfa.model";
import {
  EtapeSuivi,
  IDemandeActivationLigne,
  MailEnvoye,
  TypeRelance,
  VueDemandeActivation,
} from "shared/models/routes/admin/demandes-activation.api";

export const nomCfa = (demande: IDemandeActivationLigne) =>
  demande.organisme?.nom ?? (demande.organisme ? "CFA sans nom" : "Organisme non trouvé");

export const LIBELLES_VUES: Record<VueDemandeActivation, string> = {
  a_envoyer: "À envoyer",
  envoyees: "Envoyées",
  refus: "Refus",
  devenus_eligibles: "Devenus éligibles",
  echecs: "Échecs",
};

export const LIBELLES_BRANCHES: Record<BrancheDemandeActivation, string> = {
  activation: "Activation",
  compte_existant: "Compte existant",
  refus: "Refus",
};

export const libelleBranche = (demande: Pick<IDemandeActivationLigne, "branche" | "motifs">) =>
  demande.branche !== "refus"
    ? LIBELLES_BRANCHES[demande.branche]
    : refusAvecMail(demande.motifs)
      ? "Refus avec mail"
      : "Refus sans mail";

export const STATUTS: Record<
  StatutDemandeActivation,
  { libelle: string; severity?: "success" | "info" | "warning" | "error" }
> = {
  pret: { libelle: "Prête" },
  envoi_en_cours: { libelle: "Envoi en cours", severity: "info" },
  envoyee: { libelle: "Envoyée", severity: "success" },
  echec: { libelle: "Échec", severity: "error" },
  invitation_expiree: { libelle: "Invitation expirée", severity: "warning" },
};

export const LIBELLES_ROLES = { admin: "Rôle : admin", member: "Rôle : membre" } as const;

type EtatCompte = { libelle: string; severity: "success" | "info" | "warning"; note?: string };

export function etatCompte(
  compte: NonNullable<IDemandeActivationLigne["compte"]>,
  branche: BrancheDemandeActivation
): EtatCompte {
  if (compte.account_status === "CONFIRMED") return { libelle: "Confirmé", severity: "success" };
  if (compte.account_status === "PENDING_ADMIN_VALIDATION") {
    return { libelle: "Email validé", severity: "info", note: "Compte validé à l'envoi" };
  }
  if (compte.organisation_role) {
    return { libelle: "Email à valider", severity: "warning", note: "Lien de validation renvoyé à l'envoi" };
  }
  return {
    libelle: "Non confirmé",
    severity: "warning",
    note: branche === "activation" ? "Remplacé par une invitation" : undefined,
  };
}

export const ETAPES: Record<EtapeSuivi, { libelle: string; severity: "info" | "success" }> = {
  compte_a_creer: { libelle: "Compte à créer", severity: "info" },
  compte_a_valider: { libelle: "Compte à valider", severity: "info" },
  pas_connecte: { libelle: "Pas connecté", severity: "info" },
  connecte: { libelle: "Connecté", severity: "success" },
};

export const LIBELLES_MAILS_ENVOYES: Record<MailEnvoye, string> = {
  invitation: "Invitation",
  lien_validation: "Lien de validation renvoyé",
  compte_existant: "Compte existant",
};

export const LIBELLES_RELANCES: Record<TypeRelance, string> = {
  sans_compte: "rappel de création de compte",
  validation_email: "lien de validation renvoyé",
  avec_compte: "rappel de connexion",
  invitez: "invitez vos collaborateurs",
  sans_invitation: "rappel d'invitation des collaborateurs",
  invitation_en_attente: "rappel d'invitation en attente",
};

export function precisionEtape({ compte, suivi }: Pick<IDemandeActivationLigne, "compte" | "suivi">): string | null {
  if (suivi?.etape === "compte_a_creer") {
    if (suivi.compte_ailleurs) return "Compte dans un autre établissement";
    return suivi.mail_envoye === "compte_existant" ? "Compte supprimé" : null;
  }
  if (suivi?.etape === "compte_a_valider") {
    return compte?.account_status === "PENDING_ADMIN_VALIDATION" ? "Validation admin en attente" : "E-mail non validé";
  }
  return null;
}

const MAILS_DE_REFUS: Record<
  "envoye" | "pas_encore_envoye" | "sans_mail",
  { libelle: string; severity?: "success" | "warning" }
> = {
  envoye: { libelle: "Envoyé", severity: "success" },
  pas_encore_envoye: { libelle: "Pas encore envoyé" },
  sans_mail: { libelle: "Sans mail", severity: "warning" },
};

export const mailDeRefus = (demande: Pick<IDemandeActivationLigne, "statut" | "motifs">) =>
  MAILS_DE_REFUS[
    demande.statut === "envoyee" ? "envoye" : refusAvecMail(demande.motifs) ? "pas_encore_envoye" : "sans_mail"
  ];

export const refusEnvoyeLe = (demande: Pick<IDemandeActivationLigne, "statut" | "envoyee_at">) =>
  demande.statut === "envoyee" ? demande.envoyee_at : null;
