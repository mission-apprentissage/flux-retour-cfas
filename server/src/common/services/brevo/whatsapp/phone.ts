import { parsePhoneNumberWithError, CountryCode } from "libphonenumber-js";
import { getDomTomISOCountryCodeFromPhoneNumber } from "shared/utils/phone";

import logger from "@/common/logger";
import config from "@/config";

/**
 * Masque un numéro de téléphone pour les logs
 */
export function maskPhone(phone: string): string {
  if (phone.length <= 6) return phone.slice(0, 3) + "****";
  return phone.slice(0, 4) + "****" + phone.slice(-2);
}

/**
 * Override de test : en non-prod, redirige le destinataire vers `MNA_TDB_WHATSAPP_TEST_PHONE_OVERRIDE`
 * si défini. Permet de tester le flow complet (envoi initial + webhook réponse) sur son
 * propre numéro sans envoyer à de vrais effectifs.
 *
 * Garde-fous :
 * - **Ignoré silencieusement en production** : même si l'env var est posée par accident.
 * - Override invalide (numéro non parsable) → log error + fallback au numéro original.
 * - Le numéro override est lui-même normalisé E.164 avant retour.
 *
 * ⚠️ Limitation — tester un effectif à la fois : le numéro override est stocké dans
 * `whatsapp_contact.phone_normalized` pour que le webhook inbound retrouve l'effectif test.
 * Si plusieurs effectifs sont arrosés en même temps, ils partagent le même phone_normalized
 * et le lookup inbound retourne le plus récent (sort: last_message_sent_at). Pour tester
 * un backfill, dérouler les effectifs un par un (envoi + réponse + clôture).
 */
export function applyTestPhoneOverride(phone: string): string {
  const override = config.brevo.whatsapp?.testPhoneOverride;
  if (!override) return phone;
  if (config.env === "production") {
    logger.warn("MNA_TDB_WHATSAPP_TEST_PHONE_OVERRIDE ignored in production env");
    return phone;
  }
  const normalized = normalizePhoneNumber(override);
  if (!normalized) {
    logger.error({ overrideMasked: maskPhone(override) }, "TEST_PHONE_OVERRIDE invalid, falling back");
    return phone;
  }
  logger.warn(
    { originalMasked: maskPhone(phone), overrideMasked: maskPhone(normalized) },
    "WhatsApp PHONE OVERRIDE active — message redirigé vers le numéro de test"
  );
  return normalized;
}

/**
 * Normalise un numéro de téléphone (+33612345678)
 */
export function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;

  try {
    const countryCode: CountryCode = getDomTomISOCountryCodeFromPhoneNumber(phone);
    const phoneNumber = parsePhoneNumberWithError(phone, countryCode);

    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.format("E.164");
    }

    return null;
  } catch (error) {
    logger.warn("Failed to normalize phone number");
    return null;
  }
}
