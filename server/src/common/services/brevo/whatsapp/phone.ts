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

/**
 * Retourne le numéro cible
 */
export function getTargetPhone(effectifPhone: string): string | null {
  const testOverride = config.brevo.whatsapp?.testPhoneOverride;
  if (testOverride && config.env !== "production") {
    logger.info("Using test phone override for WhatsApp");
    return normalizePhoneNumber(testOverride);
  }
  return normalizePhoneNumber(effectifPhone);
}
