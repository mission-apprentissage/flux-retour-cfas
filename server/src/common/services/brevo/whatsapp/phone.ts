import { parsePhoneNumberWithError, CountryCode } from "libphonenumber-js";
import { getDomTomISOCountryCodeFromPhoneNumber } from "shared/utils/phone";

import logger from "@/common/logger";

/**
 * Masque un numéro de téléphone pour les logs
 */
export function maskPhone(phone: string): string {
  if (phone.length <= 6) return phone.slice(0, 3) + "****";
  return phone.slice(0, 4) + "****" + phone.slice(-2);
}

/**
 * Normalise un numéro de téléphone (+33612345678).
 *
 * `silent: true` désactive le `logger.warn` par-invalide — utile en bulk
 * (sync TBA p.ex.) où ~N invalides saturent Pino et font exploser la durée.
 */
export function normalizePhoneNumber(
  phone: string | null | undefined,
  options: { silent?: boolean } = {}
): string | null {
  if (!phone) return null;

  try {
    const countryCode: CountryCode = getDomTomISOCountryCodeFromPhoneNumber(phone);
    const phoneNumber = parsePhoneNumberWithError(phone, countryCode);

    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.format("E.164");
    }

    return null;
  } catch (error) {
    if (!options.silent) {
      logger.warn("Failed to normalize phone number");
    }
    return null;
  }
}
