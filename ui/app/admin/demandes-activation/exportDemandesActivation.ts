import { format } from "date-fns";
import { MOTIFS_DEMANDE_ACTIVATION } from "shared/models/data/demandesActivationCfa.model";
import {
  IDemandeActivationLigne,
  VUES_DEMANDES_ACTIVATION,
  VueDemandeActivation,
} from "shared/models/routes/admin/demandes-activation.api";

import type { ExportColumn } from "@/common/utils/exportUtils";

import {
  ETAPES,
  etatCompte,
  libelleBranche,
  LIBELLES_MAILS_ENVOYES,
  LIBELLES_RELANCES,
  LIBELLES_VUES,
  mailDeRefus,
  nomCfa,
  precisionEtape,
  refusEnvoyeLe,
  STATUTS,
} from "./libelles";

const COLONNES_EXPORT = {
  cfa: { label: "CFA", width: 40 },
  siret: { label: "SIRET retenu", width: 16 },
  siret_saisi: { label: "SIRET saisi", width: 18 },
  uai: { label: "UAI", width: 10 },
  siret_propose: { label: "SIRET ouvert proposé", width: 18 },
  effectifs_erp: { label: "Effectifs ERP", width: 12 },
  effectifs_deca: { label: "Effectifs DECA", width: 12 },
  email: { label: "E-mail retenu", width: 32 },
  email_saisi: { label: "E-mail saisi", width: 32 },
  fonction: { label: "Fonction", width: 26 },
  compte_nom: { label: "Nom du compte", width: 24 },
  domaine_inconnu: { label: "Domaine inconnu", width: 14 },
  commentaire: { label: "Remarque", width: 50 },
  inscription: { label: "Inscrit le", width: 17, xlsxType: "date" },
  horodateur_brut: { label: "Horodateur brut", width: 26 },
  envoyee_le: { label: "Envoyée le", width: 17, xlsxType: "date" },
  mail_envoye: { label: "Mail envoyé", width: 24 },
  source: { label: "Source", width: 22 },
  compte_etat: { label: "État du compte", width: 16 },
  compte_role: { label: "Rôle", width: 10 },
  branche: { label: "Branche", width: 16 },
  refus_envoye_le: { label: "Refus envoyé le", width: 17, xlsxType: "date" },
  motifs: { label: "Motifs", width: 50 },
  mail_refus: { label: "Mail de refus", width: 18 },
  statut: { label: "Statut", width: 18 },
  motif_echec: { label: "Motif d'échec", width: 40 },
  cochee: { label: "Cochée", width: 14 },
  etape: { label: "Étape", width: 18 },
  etape_detail: { label: "Détail de l'étape", width: 32 },
  compte_cree_le: { label: "Compte créé le", width: 17, xlsxType: "date" },
  connexion_apres_envoi: { label: "Connecté après l'envoi le", width: 17, xlsxType: "date" },
  derniere_connexion: { label: "Dernière connexion", width: 17, xlsxType: "date" },
  collaborateurs_invites: { label: "Collaborateurs invités", width: 12 },
  collaborateurs_inscrits: { label: "Collaborateurs inscrits", width: 12 },
  derniere_relance: { label: "Dernier mail auto", width: 36 },
  derniere_relance_le: { label: "Dernier mail auto le", width: 17, xlsxType: "date" },
} as const satisfies Record<string, Omit<ExportColumn, "key">>;

type CleExport = keyof typeof COLONNES_EXPORT;

const COLONNES_CFA: CleExport[] = [
  "cfa",
  "siret",
  "siret_saisi",
  "uai",
  "siret_propose",
  "effectifs_erp",
  "effectifs_deca",
];
const COLONNES_DEMANDEUR: CleExport[] = [
  "email",
  "email_saisi",
  "fonction",
  "compte_nom",
  "domaine_inconnu",
  "commentaire",
];
const COLONNES_INSCRIPTION: CleExport[] = ["inscription", "horodateur_brut"];
const COLONNES_COMPTE: CleExport[] = ["compte_etat", "compte_role"];
const COLONNES_SUIVI: CleExport[] = [
  "etape",
  "etape_detail",
  "compte_cree_le",
  "connexion_apres_envoi",
  "derniere_connexion",
  "collaborateurs_invites",
  "collaborateurs_inscrits",
  "derniere_relance",
  "derniere_relance_le",
];

const COLONNES_EXPORT_PAR_VUE: Record<VueDemandeActivation, CleExport[]> = {
  a_envoyer: [
    ...COLONNES_CFA,
    ...COLONNES_DEMANDEUR,
    ...COLONNES_INSCRIPTION,
    "source",
    ...COLONNES_COMPTE,
    "branche",
    "cochee",
  ],
  envoyees: [...COLONNES_CFA, ...COLONNES_DEMANDEUR, "envoyee_le", "mail_envoye", "source", ...COLONNES_SUIVI],
  refus: [
    ...COLONNES_CFA,
    ...COLONNES_DEMANDEUR,
    ...COLONNES_INSCRIPTION,
    "source",
    "motifs",
    "mail_refus",
    "refus_envoye_le",
    "cochee",
  ],
  devenus_eligibles: [
    ...COLONNES_CFA,
    ...COLONNES_DEMANDEUR,
    ...COLONNES_INSCRIPTION,
    "source",
    ...COLONNES_COMPTE,
    "branche",
    "refus_envoye_le",
    "cochee",
  ],
  echecs: [
    ...COLONNES_CFA,
    ...COLONNES_DEMANDEUR,
    "source",
    ...COLONNES_COMPTE,
    "branche",
    "statut",
    "motif_echec",
    "motifs",
  ],
};

const ROLES = { admin: "admin", member: "membre" } as const;

const versLigneExport = (demande: IDemandeActivationLigne): Record<CleExport, unknown> => ({
  cfa: nomCfa(demande),
  siret: demande.siret,
  siret_saisi: demande.siret_saisi_brut,
  uai: demande.uai,
  siret_propose: demande.siret_propose,
  effectifs_erp: demande.effectifs_erp,
  effectifs_deca: demande.effectifs_deca,
  email: demande.email,
  email_saisi: demande.email_saisi,
  fonction: demande.fonction,
  compte_nom: [demande.compte?.prenom, demande.compte?.nom].filter(Boolean).join(" ") || null,
  domaine_inconnu: demande.domaine_inconnu ? "oui" : "non",
  commentaire: demande.commentaire,
  inscription: demande.horodatage,
  horodateur_brut: demande.horodatage_brut,
  envoyee_le: demande.envoyee_at,
  mail_envoye: demande.suivi && LIBELLES_MAILS_ENVOYES[demande.suivi.mail_envoye],
  source: demande.source,
  compte_etat: demande.compte ? etatCompte(demande.compte, demande.branche).libelle : "Sans compte",
  compte_role: demande.compte?.organisation_role ? ROLES[demande.compte.organisation_role] : null,
  branche: libelleBranche(demande),
  refus_envoye_le: refusEnvoyeLe(demande),
  motifs: demande.motifs.map((motif) => MOTIFS_DEMANDE_ACTIVATION[motif].libelle).join(" ; "),
  mail_refus: mailDeRefus(demande).libelle,
  statut: STATUTS[demande.statut].libelle,
  motif_echec: demande.motif_echec,
  cochee: demande.statut === "envoi_en_cours" ? "envoi en cours" : demande.a_envoyer ? "oui" : "non",
  etape: demande.suivi && ETAPES[demande.suivi.etape].libelle,
  etape_detail: precisionEtape(demande),
  compte_cree_le: demande.compte?.created_at ?? null,
  connexion_apres_envoi: demande.suivi?.connexion_apres_envoi_at ?? null,
  derniere_connexion: demande.compte?.last_connection ?? null,
  collaborateurs_invites: demande.suivi?.collaborateurs_invites ?? null,
  collaborateurs_inscrits: demande.suivi?.collaborateurs_inscrits ?? null,
  derniere_relance: demande.suivi?.derniere_relance && LIBELLES_RELANCES[demande.suivi.derniere_relance.type],
  derniere_relance_le: demande.suivi?.derniere_relance?.at ?? null,
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
    VUES_DEMANDES_ACTIVATION.map((vue) => {
      const cles = COLONNES_EXPORT_PAR_VUE[vue];
      return {
        sheetName: LIBELLES_VUES[vue],
        rows: demandes
          .filter((demande) => demande.vue === vue)
          .map((demande) => {
            const ligne = versLigneExport(demande);
            return Object.fromEntries(cles.map((cle) => [cle, ligne[cle]]));
          }),
        columns: cles.map((key) => ({ key, ...COLONNES_EXPORT[key] })),
        dateNF: "dd/mm/yyyy hh:mm",
      };
    })
  );
}
