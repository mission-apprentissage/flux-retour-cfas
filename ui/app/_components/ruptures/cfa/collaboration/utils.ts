import { ACC_CONJOINT_MOTIF_ENUM } from "shared";

import { isValidPhone } from "@/app/_utils/phone.utils";

import { FREINS_MOTIFS } from "./constants";
import { VerifiedInfo } from "./hooks";
import { FormValues } from "./types";

// Validation du téléphone centralisée (libphonenumber, gère métropole + DOM-TOM),
// alignée sur la validation serveur pour éviter toute divergence front/back.
export { isValidPhone };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function isObjectifsValid(v: FormValues): boolean {
  if (v.motifs.length === 0) return false;
  const commentaireRequis = [ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI, ...FREINS_MOTIFS];
  return commentaireRequis.every((m) => !v.motifs.includes(m) || !!v.commentaires_par_motif[m]?.trim());
}

export function isDatesRuptureValid(v: FormValues): boolean {
  if (!v.date_rupture) return false;
  if (v.still_at_cfa === false && !v.date_abandon) return false;
  if (v.date_abandon && v.date_abandon < v.date_rupture) return false;
  return !!v.cause_rupture.trim();
}

export function isRentreeSansContratValid(v: FormValues): boolean {
  return !!v.date_debut_formation && !!v.recherche_entreprise.trim();
}

export function isContactValid(v: FormValues): boolean {
  const info = v.verified_info;
  if (!info.telephone.trim() || !isValidPhone(info.telephone)) return false;
  if (info.courriel.trim() && !isValidEmail(info.courriel)) return false;
  if (!info.adresse_code_postal.trim() || !info.adresse_commune.trim()) return false;
  if (v.referent_type === null) return false;
  if (v.referent_type === "other" && !v.referent_details.trim()) return false;
  return true;
}
