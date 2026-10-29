import { format } from "date-fns";
import { MOTIFS_DEMANDE_ACTIVATION } from "shared/models/data/demandesActivationCfa.model";
import { IDemandeActivationLigne, VUES_DEMANDES_ACTIVATION } from "shared/models/routes/admin/demandes-activation.api";

import type { ExportColumn } from "@/common/utils/exportUtils";

import { etatCompte, libelleBranche, LIBELLES_VUES, nomCfa, STATUTS } from "./libelles";

const COLONNES_EXPORT = [
  { key: "source", label: "Source", width: 22 },
  { key: "inscription", label: "Inscrit le", width: 17, xlsxType: "date" },
  { key: "horodateur_brut", label: "Horodateur brut", width: 26 },
  { key: "cfa", label: "CFA", width: 40 },
  { key: "siret", label: "SIRET retenu", width: 16 },
  { key: "siret_saisi", label: "SIRET saisi", width: 18 },
  { key: "uai", label: "UAI", width: 10 },
  { key: "siret_propose", label: "SIRET ouvert proposé", width: 18 },
  { key: "email", label: "E-mail retenu", width: 32 },
  { key: "email_saisi", label: "E-mail saisi", width: 32 },
  { key: "fonction", label: "Fonction", width: 26 },
  { key: "compte_nom", label: "Nom du compte", width: 24 },
  { key: "compte_etat", label: "État du compte", width: 16 },
  { key: "compte_role", label: "Rôle", width: 10 },
  { key: "effectifs_erp", label: "Effectifs ERP", width: 12 },
  { key: "effectifs_deca", label: "Effectifs DECA", width: 12 },
  { key: "branche", label: "Branche", width: 16 },
  { key: "motifs", label: "Motifs", width: 50 },
  { key: "domaine_inconnu", label: "Domaine inconnu", width: 14 },
  { key: "statut", label: "Statut", width: 18 },
  { key: "motif_echec", label: "Motif d'échec", width: 40 },
  { key: "envoyee_le", label: "Envoyée le", width: 17, xlsxType: "date" },
  { key: "cochee", label: "Cochée", width: 8 },
  { key: "commentaire", label: "Remarque", width: 50 },
] as const satisfies ReadonlyArray<ExportColumn>;

const ROLES = { admin: "admin", member: "membre" } as const;

const versLigneExport = (demande: IDemandeActivationLigne) => ({
  source: demande.source,
  inscription: demande.horodatage,
  horodateur_brut: demande.horodatage_brut,
  cfa: nomCfa(demande),
  siret: demande.siret,
  siret_saisi: demande.siret_saisi_brut,
  uai: demande.uai,
  siret_propose: demande.siret_propose,
  email: demande.email,
  email_saisi: demande.email_saisi,
  fonction: demande.fonction,
  compte_nom: [demande.compte?.prenom, demande.compte?.nom].filter(Boolean).join(" ") || null,
  compte_etat: demande.compte ? etatCompte(demande.compte, demande.branche).libelle : "Sans compte",
  compte_role: demande.compte?.organisation_role ? ROLES[demande.compte.organisation_role] : null,
  effectifs_erp: demande.effectifs_erp,
  effectifs_deca: demande.effectifs_deca,
  branche: libelleBranche(demande),
  motifs: demande.motifs.map((motif) => MOTIFS_DEMANDE_ACTIVATION[motif].libelle).join(" ; "),
  domaine_inconnu: demande.domaine_inconnu ? "oui" : "non",
  statut: STATUTS[demande.statut].libelle,
  motif_echec: demande.motif_echec,
  envoyee_le: demande.envoyee_at,
  cochee: demande.a_envoyer ? "oui" : "non",
  commentaire: demande.commentaire,
});

const pourNomDeFichier = (texte: string) =>
  texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

export async function exporterDemandesActivation(demandes: IDemandeActivationLigne[], source: string) {
  const { exportMultiSheetXlsx } = await import("@/common/utils/exportUtils");
  const suffixe = source ? `-${pourNomDeFichier(source)}` : "";
  exportMultiSheetXlsx(
    `demandes-activation-${format(new Date(), "yyyy-MM-dd")}${suffixe}.xlsx`,
    VUES_DEMANDES_ACTIVATION.map((vue) => ({
      sheetName: LIBELLES_VUES[vue],
      rows: demandes.filter((demande) => demande.vue === vue).map(versLigneExport),
      columns: COLONNES_EXPORT,
      dateNF: "dd/mm/yyyy hh:mm",
    }))
  );
}
