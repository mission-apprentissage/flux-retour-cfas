import { ACC_CONJOINT_MOTIF_ENUM } from "shared";

import { FREINS_MOTIFS } from "./constants";
import { VerifiedInfo } from "./hooks";
import { FormValues } from "./types";

const PHONE_RE = /^(?:(?:\+|00)33[\s.-]?|0)[1-9](?:[\s.-]?\d{2}){4}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidPhone(value: string): boolean {
  return PHONE_RE.test(value.replace(/\s/g, ""));
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function buildAdresseRue(adresse: Record<string, unknown> | null | undefined): string {
  if (!adresse) return "";
  const parts: string[] = [];
  if (adresse.numero) parts.push(String(adresse.numero));
  if (adresse.repetition_voie) parts.push(String(adresse.repetition_voie));
  if (adresse.voie) parts.push(String(adresse.voie));
  if (parts.length > 0) return parts.join(" ");
  if (adresse.complete) return String(adresse.complete);
  return "";
}

export function formatAdresseDisplay(info: VerifiedInfo): string {
  const parts: string[] = [];
  if (info.adresse_rue) parts.push(info.adresse_rue);
  if (info.adresse_commune && info.adresse_code_postal) {
    parts.push(`${info.adresse_commune} (${info.adresse_code_postal})`);
  } else if (info.adresse_commune) {
    parts.push(info.adresse_commune);
  }
  return parts.join(", ");
}

export function isSection1Valid(v: FormValues): boolean {
  if (v.still_at_cfa === null) return false;
  if (v.motifs.length === 0) return false;
  const freinsOk = FREINS_MOTIFS.every((m) => !v.motifs.includes(m) || !!v.commentaires_par_motif[m]?.trim());
  if (
    v.motifs.includes(ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI) &&
    !v.commentaires_par_motif[ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI]?.trim()
  )
    return false;
  if (
    v.motifs.includes(ACC_CONJOINT_MOTIF_ENUM.REORIENTATION) &&
    !v.commentaires_par_motif[ACC_CONJOINT_MOTIF_ENUM.REORIENTATION]?.trim()
  )
    return false;
  return freinsOk;
}

export function isSection3Valid(v: FormValues): boolean {
  return !!v.cause_rupture.trim();
}

export function isSection4Valid(v: FormValues): boolean {
  if (v.referent_type === null) return false;
  if (v.referent_type === "other" && !v.referent_details.trim()) return false;
  return true;
}

export function isSection5Valid(v: FormValues): boolean {
  const info = v.verified_info;
  if (!info.telephone.trim() || !isValidPhone(info.telephone)) return false;
  if (info.courriel.trim() && !isValidEmail(info.courriel)) return false;
  return !!(
    info.adresse_rue.trim() &&
    info.adresse_code_postal.trim() &&
    info.adresse_commune.trim() &&
    info.formation_libelle.trim() &&
    info.date_fin_formation.trim()
  );
}

export function computeProgress(v: FormValues): number {
  let filled = 0;
  const total = 10;

  if (v.still_at_cfa !== null) filled++;
  if (v.motifs.length > 0) filled++;
  if (v.cause_rupture.trim()) filled++;
  if (v.referent_type !== null) filled++;
  if (v.verified_info.telephone.trim()) filled++;
  if (v.verified_info.adresse_rue.trim()) filled++;
  if (v.verified_info.adresse_code_postal.trim()) filled++;
  if (v.verified_info.adresse_commune.trim()) filled++;
  if (v.verified_info.formation_libelle.trim()) filled++;
  if (v.verified_info.date_fin_formation.trim()) filled++;

  return Math.round((filled / total) * 100);
}
