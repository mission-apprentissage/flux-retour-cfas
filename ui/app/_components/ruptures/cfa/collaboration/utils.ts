import { FormikErrors } from "formik";
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

const CHAMP_OBLIGATOIRE = "Ce champ est obligatoire";

export function objectifsErrors(v: FormValues): FormikErrors<FormValues> {
  const errors: FormikErrors<FormValues> = {};
  if (v.motifs.length === 0) {
    errors.motifs = "Sélectionnez au moins un objectif";
  }

  const commentaires: Partial<Record<ACC_CONJOINT_MOTIF_ENUM, string>> = {};
  for (const motif of FREINS_MOTIFS) {
    if (v.motifs.includes(motif) && !v.commentaires_par_motif[motif]?.trim()) {
      commentaires[motif] = "Précisez le contexte pour la Mission Locale";
    }
  }
  if (
    v.motifs.includes(ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI) &&
    !v.commentaires_par_motif[ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI]?.trim()
  ) {
    commentaires[ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI] = "Précisez votre demande d'aide";
  }
  if (Object.keys(commentaires).length > 0) {
    errors.commentaires_par_motif = commentaires;
  }

  return errors;
}

export function datesRuptureErrors(v: FormValues): FormikErrors<FormValues> {
  const errors: FormikErrors<FormValues> = {};
  if (!v.date_rupture) errors.date_rupture = CHAMP_OBLIGATOIRE;
  if (v.still_at_cfa === false && !v.date_abandon) errors.date_abandon = CHAMP_OBLIGATOIRE;
  if (v.date_abandon && v.date_abandon < v.date_rupture) {
    errors.date_abandon = "La date d'abandon ne peut pas précéder la date de rupture";
  }
  if (!v.cause_rupture.trim()) errors.cause_rupture = CHAMP_OBLIGATOIRE;
  return errors;
}

export function rentreeSansContratErrors(v: FormValues): FormikErrors<FormValues> {
  const errors: FormikErrors<FormValues> = {};
  if (!v.date_debut_formation) errors.date_debut_formation = CHAMP_OBLIGATOIRE;
  if (!v.recherche_entreprise.trim()) errors.recherche_entreprise = CHAMP_OBLIGATOIRE;
  return errors;
}

export function contactErrors(v: FormValues): FormikErrors<FormValues> {
  const errors: FormikErrors<FormValues> = {};
  const info = v.verified_info;

  const infoErrors: FormikErrors<VerifiedInfo> = {};
  if (!info.telephone.trim()) infoErrors.telephone = CHAMP_OBLIGATOIRE;
  else if (!isValidPhone(info.telephone)) infoErrors.telephone = "Numéro de téléphone invalide";
  if (info.courriel.trim() && !isValidEmail(info.courriel)) infoErrors.courriel = "Adresse email invalide";
  if (!info.adresse_code_postal.trim()) infoErrors.adresse_code_postal = CHAMP_OBLIGATOIRE;
  if (!info.adresse_commune.trim()) infoErrors.adresse_commune = CHAMP_OBLIGATOIRE;
  if (Object.keys(infoErrors).length > 0) errors.verified_info = infoErrors;

  if (v.referent_type === null) errors.referent_type = "Veuillez indiquer un contact";
  if (v.referent_type === "other" && !v.referent_details.trim()) {
    errors.referent_details = "Veuillez indiquer les coordonnées du référent";
  }

  return errors;
}

const sansErreur = (errors: FormikErrors<FormValues>): boolean => Object.keys(errors).length === 0;

export const isObjectifsValid = (v: FormValues): boolean => sansErreur(objectifsErrors(v));
export const isDatesRuptureValid = (v: FormValues): boolean => sansErreur(datesRuptureErrors(v));
export const isRentreeSansContratValid = (v: FormValues): boolean => sansErreur(rentreeSansContratErrors(v));
export const isContactValid = (v: FormValues): boolean => sansErreur(contactErrors(v));
