import {
  BrancheDemandeActivation,
  refusAvecMail,
  StatutDemandeActivation,
} from "shared/models/data/demandesActivationCfa.model";
import { IDemandeActivationLigne, VueDemandeActivation } from "shared/models/routes/admin/demandes-activation.api";

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
