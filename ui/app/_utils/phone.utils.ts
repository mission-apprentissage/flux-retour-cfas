import { parsePhoneNumberWithError } from "libphonenumber-js";
import { getDomTomISOCountryCodeFromPhoneNumber } from "shared/utils/phone";

export function formatPhoneNumber(phone: string | undefined | null): string | null {
  if (!phone) return null;

  try {
    const countryCode = getDomTomISOCountryCodeFromPhoneNumber(phone);
    const phoneNumber = parsePhoneNumberWithError(phone, countryCode);

    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.formatNational();
    }

    return null;
  } catch {
    return null;
  }
}
