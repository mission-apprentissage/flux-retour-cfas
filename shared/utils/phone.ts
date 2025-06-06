import { CountryCode } from "libphonenumber-js/max";

export function maskTelephone(telephone: string | null | undefined): string | null {
  if (!telephone) {
    return null;
  }

  let maskedTelephone = "";

  if (telephone.length <= 6) {
    const visibleStart = telephone.slice(0, 2);
    const maskedSection = "*".repeat(Math.max(0, telephone.length - 2));
    maskedTelephone = visibleStart + maskedSection;
  } else {
    const visibleStart = telephone.slice(0, 2);
    const visibleEnd = telephone.slice(-4);
    const maskedSectionLength = telephone.length - 6;
    const maskedSection = "*".repeat(maskedSectionLength);
    maskedTelephone = visibleStart + maskedSection + visibleEnd;
  }

  return maskedTelephone.replace(/(.{2})/g, "$1 ").trim();
}

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
