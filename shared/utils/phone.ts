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

  if (phoneNumberWithoutPrefix.startsWith("69")) {
    return "RE"; // Réunion
  } else if (phoneNumberWithoutPrefix.startsWith("80")) {
    return "PF"; // Polynésie française
  } else if (phoneNumberWithoutPrefix.startsWith("90")) {
    return "NC"; // Nouvelle-Calédonie
  } else if (phoneNumberWithoutPrefix.startsWith("97")) {
    return "WF"; // Wallis-et-Futuna
  } else if (phoneNumberWithoutPrefix.startsWith("98")) {
    return "YT"; // Mayotte
  }

  return "FR"; // Not a DOM-TOM number
}
