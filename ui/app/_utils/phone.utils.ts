import { parsePhoneNumberWithError } from "libphonenumber-js";

export function formatPhoneNumber(phone: string | undefined | null): string {
  if (!phone) return "";

  try {
    const phoneNumber = parsePhoneNumberWithError(phone, "FR");

    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.formatNational();
    }

    return phone;
  } catch {
    return phone;
  }
}
