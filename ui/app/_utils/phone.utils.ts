import { parsePhoneNumberWithError } from "libphonenumber-js";

export function formatPhoneNumber(phone: string | undefined | null): string {
  console.log("formatPhoneNumber", phone);
  if (!phone) return "";

  try {
    const phoneNumber = parsePhoneNumberWithError(phone, "FR");

    if (phoneNumber && phoneNumber.isValid()) {
      console.log(phoneNumber.formatNational());
      return phoneNumber.formatNational();
    }

    return phone;
  } catch {
    return phone;
  }
}
