import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import { isAgeEligibleMissionLocale } from "shared/utils";

import { CONTACT_OPPORTUN_SCORE_THRESHOLD } from "@/common/actions/mission-locale/mission-locale.constants";
import logger from "@/common/logger";
import config from "@/config";

import { normalizePhoneNumber } from "./phone";
import { enqueueWhatsAppInitial } from "./queue";

export const PREQUALIF_RUPTURE_MAX_DAYS = 180;

/**
 * Exclusion PRD du flux préqualif : le dossier est suivi via la collaboration CFA
 * (CFA basculé V2 ou accompagnement conjoint), le rappel WhatsApp ne s'applique pas.
 * Utilisée à l'envoi (éligibilité) et à la réponse (garde anti-race dans les handlers).
 */
export function isExcludedByCfaCollab(effectif: IMissionLocaleEffectif): boolean {
  return effectif.computed?.organisme?.is_allowed_collab === true || effectif.organisme_data?.acc_conjoint === true;
}

/**
 * Vérifie si un effectif est éligible pour recevoir un WhatsApp préqualif.
 *
 * Cible : "contacts opportuns" (score classifier ≥ 0.75) jamais traités, hors CFA V2
 * collab, hors `acc_conjoint=true`, rupture < `PREQUALIF_RUPTURE_MAX_DAYS` jours.
 */
export function isEligibleForPrequalif(effectif: IMissionLocaleEffectif): boolean {
  const phone = effectif.effectif_snapshot?.apprenant?.telephone;
  if (!phone || !normalizePhoneNumber(phone)) return false;

  if (!isAgeEligibleMissionLocale(effectif.effectif_snapshot?.apprenant?.date_de_naissance)) return false;

  if (effectif.whatsapp_contact?.last_message_sent_at) return false;
  if (effectif.whatsapp_contact?.opted_out) return false;

  const score = effectif.classification_reponse_appel?.score ?? 0;
  if (score < CONTACT_OPPORTUN_SCORE_THRESHOLD) return false;

  if (isExcludedByCfaCollab(effectif)) return false;

  if (effectif.situation !== null && effectif.situation !== undefined) return false;

  if (effectif.current_status?.value === STATUT_APPRENANT.FIN_DE_FORMATION) return false;

  if (!effectif.date_rupture) return false;
  const ruptureCutoff = new Date(Date.now() - PREQUALIF_RUPTURE_MAX_DAYS * 24 * 60 * 60 * 1000);
  if (new Date(effectif.date_rupture) < ruptureCutoff) return false;

  return true;
}

/**
 * Vérifie si un effectif est éligible pour recevoir un WhatsApp
 */
export function isEligibleForWhatsApp(effectif: IMissionLocaleEffectif): boolean {
  // Pas de téléphone valide
  const phone = effectif.effectif_snapshot?.apprenant?.telephone;
  if (!phone || !normalizePhoneNumber(phone)) {
    return false;
  }

  if (!isAgeEligibleMissionLocale(effectif.effectif_snapshot?.apprenant?.date_de_naissance)) {
    return false;
  }

  // Le message "injoignables" s'adresse à un jeune en rupture : un dossier de collaboration
  // ouvert en prévention ou pour une rentrée sans contrat n'a pas de date de rupture et ne doit
  // pas le recevoir. Le job batch applique déjà ce filtre, pas le déclenchement immédiat.
  if (!effectif.date_rupture) {
    return false;
  }

  // Déjà contacté par WhatsApp
  if (effectif.whatsapp_contact?.last_message_sent_at) {
    return false;
  }

  // A fait opt-out
  if (effectif.whatsapp_contact?.opted_out) {
    return false;
  }

  return true;
}

/**
 * Déclenche l'envoi WhatsApp si l'effectif est éligible.
 * Appelé après qu'une ML marque un effectif comme CONTACTE_SANS_RETOUR : l'envoi lui-même part par job
 * (`whatsapp:send-initial`), l'agent n'attend pas Brevo. Les gardes de config et d'éligibilité sont
 * évaluées ici pour ne pas enfiler un job inutile, puis revérifiées par le job.
 */
export async function triggerWhatsAppIfEligible(
  effectif: IMissionLocaleEffectif | null,
  missionLocaleId: ObjectId
): Promise<void> {
  if (!effectif) {
    logger.warn({ missionLocaleId }, "triggerWhatsAppIfEligible: effectif is null");
    return;
  }

  // Defense-in-depth : refuse tout envoi hors prod sans test override, indépendamment du flag
  // `enabled`. Évite qu'une mauvaise config (env var inversée, secret partagé) ne provoque
  // un envoi accidentel à de vrais effectifs depuis preprod/recette/local.
  if (config.env !== "production" && !config.brevo.whatsapp?.testPhoneOverride) {
    logger.warn({ effectifId: effectif._id }, "WhatsApp send blocked: non-prod env without TEST_PHONE_OVERRIDE");
    return;
  }

  if (!config.brevo.whatsapp?.enabled) {
    logger.debug({ effectifId: effectif._id }, "WhatsApp feature is disabled");
    return;
  }

  if (!isEligibleForWhatsApp(effectif)) {
    logger.debug(
      {
        effectifId: effectif._id,
        hasPhone: !!effectif.effectif_snapshot?.apprenant?.telephone,
        alreadyContacted: !!effectif.whatsapp_contact?.last_message_sent_at,
        optedOut: !!effectif.whatsapp_contact?.opted_out,
      },
      "Effectif not eligible for WhatsApp"
    );
    return;
  }

  await enqueueWhatsAppInitial(effectif._id, missionLocaleId);
}
