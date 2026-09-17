import { CountryCode } from "libphonenumber-js/max";

export function getDomTomISOCountryCodeFromPhoneNumber(phoneNumber: string | null | undefined): CountryCode {
  if (!phoneNumber) {
    return "FR";
  }

  const phoneNumberWithoutSpaces = phoneNumber.replace(/\s/g, "");
  const phoneNumberWithoutPrefix = phoneNumberWithoutSpaces.startsWith("0")
    ? phoneNumberWithoutSpaces.slice(1)
    : phoneNumberWithoutSpaces;

  switch (phoneNumberWithoutPrefix.slice(0, 3)) {
    case "690":
    case "590":
      return "GP"; // Guadeloupe
    case "694":
    case "594":
      return "GF"; // Guyane
    case "696":
    case "596":
      return "MQ"; // Martinique
    case "692":
    case "693":
    case "262":
    case "269":
      return "RE"; // Réunion et Mayotte
    default:
      return "FR"; // France métropolitaine
  }
}
