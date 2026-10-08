import { subDays } from "date-fns";
import { ObjectId } from "mongodb";

import { organisationsDb, organismesDb } from "@/common/model/collections";

import { CFA_HOST_CODES, type CfaHostCode, type SeedRecetteHosts } from "./hosts";

export const ML_A_RDV_URL = "https://rdv.seed.recette.invalid/ml-a";

const COLLAB_FLAGS = [
  "is_allowed_collab",
  "is_allowed_deca",
  "collab_inactivity_email_sent_at",
  "collab_suspended_at",
  "collab_resumed_at",
] as const;

interface CfaHostFlags {
  mlBetaJours: number | null;
  organisme: Partial<Record<(typeof COLLAB_FLAGS)[number], boolean | number>>;
  hasAccount: boolean;
}

const CFA_HOST_FLAGS: Record<CfaHostCode, CfaHostFlags> = {
  CFA_ON: { mlBetaJours: 120, organisme: { is_allowed_collab: true }, hasAccount: true },
  CFA_SUSP: {
    mlBetaJours: 150,
    organisme: { is_allowed_collab: true, collab_inactivity_email_sent_at: 40, collab_suspended_at: 35 },
    hasAccount: true,
  },
  CFA_OFF: { mlBetaJours: null, organisme: {}, hasAccount: true },
  CFA_SANS: { mlBetaJours: null, organisme: {}, hasAccount: false },
  CFA_DECA: { mlBetaJours: 120, organisme: { is_allowed_collab: true, is_allowed_deca: true }, hasAccount: true },
  CFA_REAL_CAMPUS: { mlBetaJours: null, organisme: {}, hasAccount: true },
  CFA_AFTRAL: { mlBetaJours: 7, organisme: { is_allowed_collab: true }, hasAccount: true },
};

export interface Patch {
  set: Record<string, unknown>;
  unset: string[];
}

export interface HostFlagsPlan {
  organisations: Map<string, Patch>;
  organismes: Map<string, Patch>;
}

export function planHostFlags(hosts: SeedRecetteHosts, now: Date): HostFlagsPlan {
  const organisations = new Map<string, Patch>([
    [
      hosts.missionsLocales.ML_A.toHexString(),
      { set: { activated_at: subDays(now, 180), rdv_url: ML_A_RDV_URL }, unset: [] },
    ],
    [hosts.missionsLocales.ML_B.toHexString(), { set: {}, unset: ["activated_at", "rdv_url"] }],
  ]);
  const organismes = new Map<string, Patch>();

  for (const code of CFA_HOST_CODES) {
    const { organisationId, organismeId } = hosts.cfas[code];
    const { mlBetaJours, organisme, hasAccount } = CFA_HOST_FLAGS[code];

    organisations.set(
      organisationId.toHexString(),
      mlBetaJours === null
        ? { set: {}, unset: ["ml_beta_activated_at"] }
        : { set: { ml_beta_activated_at: subDays(now, mlBetaJours) }, unset: [] }
    );

    const patch: Patch = { set: { has_account: hasAccount }, unset: [] };
    for (const flag of COLLAB_FLAGS) {
      const valeur = organisme[flag];
      if (valeur === undefined) patch.unset.push(flag);
      else patch.set[flag] = typeof valeur === "number" ? subDays(now, valeur) : valeur;
    }
    organismes.set(organismeId.toHexString(), patch);
  }

  return { organisations, organismes };
}

export function applyPatch<T extends object>(doc: T, patch: Patch | undefined): T {
  if (!patch) return doc;
  const copie: Record<string, unknown> = { ...doc, ...patch.set };
  for (const champ of patch.unset) delete copie[champ];
  return copie as T;
}

const toUpdate = (patch: Patch) => ({
  ...(Object.keys(patch.set).length > 0 ? { $set: patch.set } : {}),
  ...(patch.unset.length > 0
    ? { $unset: Object.fromEntries(patch.unset.map((champ) => [champ, "" as const])) as Record<string, ""> }
    : {}),
});

export async function applyHostFlags(plan: HostFlagsPlan) {
  for (const [hex, patch] of plan.organisations) {
    await organisationsDb().updateOne({ _id: new ObjectId(hex) }, toUpdate(patch));
  }
  for (const [hex, patch] of plan.organismes) {
    await organismesDb().updateOne({ _id: new ObjectId(hex) }, toUpdate(patch));
  }
}
