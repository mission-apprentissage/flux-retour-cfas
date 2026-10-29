import { z } from "zod";

import {
  BrancheDemandeActivation,
  MotifDemandeActivation,
  StatutDemandeActivation,
} from "../../data/demandesActivationCfa.model";
import type { IUsersMigration } from "../../data/usersMigration.model";

export const VUES_DEMANDES_ACTIVATION = ["a_envoyer", "envoyees", "refus", "devenus_eligibles", "echecs"] as const;

export type VueDemandeActivation = (typeof VUES_DEMANDES_ACTIVATION)[number];

export const zModificationDemandeActivation = z
  .object({
    siret_corrige: z.string().nullable(),
    email_corrige: z.string().nullable(),
  })
  .partial()
  .strict();

export type IModificationDemandeActivation = z.output<typeof zModificationDemandeActivation>;

const zIdDemande = z.string().regex(/^[0-9a-f]{24}$/);

export const zCocheDemandesActivation = z
  .object({ ids: z.array(zIdDemande).min(1).max(1000), a_envoyer: z.boolean() })
  .strict();

export type ICocheDemandesActivation = z.output<typeof zCocheDemandesActivation>;

export const zEnvoiDemandesActivation = z.object({ ids: z.array(zIdDemande).min(1) }).strict();

export type IEnvoiDemandesActivation = z.output<typeof zEnvoiDemandesActivation>;

export interface IDemandeActivationLigne {
  _id: string;
  email: string;
  email_saisi: string;
  email_corrige: string | null;
  fonction: string | null;
  commentaire: string | null;
  horodatage: string | null;
  horodatage_brut: string | null;
  envoyee_at: string | null;
  siret_saisi_brut: string;
  siret_corrige: string | null;
  siret: string | null;
  uai: string | null;
  siret_propose: string | null;
  organisme: { nom: string | null } | null;
  compte: {
    prenom: string | null;
    nom: string | null;
    account_status: IUsersMigration["account_status"];
    organisation_role: IUsersMigration["organisation_role"] | null;
  } | null;
  effectifs_erp: number | null;
  effectifs_deca: number | null;
  motifs: MotifDemandeActivation[];
  domaine_inconnu: boolean;
  branche: BrancheDemandeActivation;
  statut: StatutDemandeActivation;
  motif_echec: string | null;
  a_envoyer: boolean;
  vue: VueDemandeActivation;
  cochable: boolean;
}

export interface IDemandesActivationResponse {
  demandes: IDemandeActivationLigne[];
}

export interface IBilanImportDemandes {
  creees: number;
  misesAJour: number;
  fusionnees: number;
  inchangees: number;
  erreurs: number;
}

export interface IBilanEnvoiDemandes {
  demandes: number;
  organismes: number;
  ecartees: number;
}
