import { IUserResponseType, USER_RESPONSE_TYPE } from "shared/models/data/whatsappContact.model";

import { MissionLocaleInfo } from "./types";

export function buildCallbackMessage(prenom: string, missionLocale: MissionLocaleInfo): string {
  return `Super *${prenom}*, un conseiller ou une conseillère de la *Mission locale ${missionLocale.nom}* devrait vous recontacter.`;
}

export function buildNoHelpMessage(prenom: string, missionLocale: MissionLocaleInfo): string {
  return `C'est noté *${prenom}*. La *Mission locale ${missionLocale.nom}* ne reprendra pas contact avec vous.`;
}

export function buildStopConfirmationMessage(): string {
  return `Votre demande a été prise en compte.
Vous ne recevrez plus de messages de notre part.`;
}

export function buildAutoReplyMessage(missionLocale: MissionLocaleInfo): string {
  const lines: string[] = [
    "L'équipe du Tableau de bord de l'apprentissage vous remercie pour votre réponse.",
    "",
    "Les messages envoyés ici sont automatiques et vous ont été adressés dans le cadre de la *Mission apprentissage* (https://beta.gouv.fr/incubateurs/mission-apprentissage.html).",
    "",
    `Si vous êtes encore en pleines recherches pour votre projet professionnel, nous vous conseillons de vous rapprocher de votre Mission Locale *${missionLocale.nom}*${missionLocale.adresse ? ` à ${missionLocale.adresse}` : ""}.`,
  ];

  if (missionLocale.telephone || missionLocale.site_web) {
    lines.push("");

    const contacts: string[] = [];
    if (missionLocale.telephone) {
      contacts.push(`les appeler directement au ${missionLocale.telephone}`);
    }
    if (missionLocale.site_web) {
      contacts.push(`aller sur leur site web ${missionLocale.site_web}`);
    }

    lines.push(`Vous pouvez ${contacts.join(" ou ")}.`);
  }

  return lines.join("\n");
}

export function isStopMessage(text: string): boolean {
  const normalizedText = text.trim().toUpperCase();
  return normalizedText === "STOP" || normalizedText === "ARRET" || normalizedText === "ARRÊT";
}

const EXACT_NO_HELP = new Set(["je ne veux pas d'aide", "je ne veux pas d aide", "non", "2", "❌"]);

const EXACT_CALLBACK = new Set([
  "je veux être recontacté·e",
  "je veux etre recontacte·e",
  "je veux être recontactée",
  "je veux être recontacté",
  "je veux etre recontactee",
  "je veux etre recontacte",
  "oui",
  "1",
  "📞",
]);

export function parseUserResponse(text: string): IUserResponseType | null {
  const normalizedText = text
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/\u00B7/g, "·"); // normaliser le point médian

  if (EXACT_NO_HELP.has(normalizedText)) {
    return USER_RESPONSE_TYPE.NO_HELP;
  }

  if (EXACT_CALLBACK.has(normalizedText)) {
    return USER_RESPONSE_TYPE.CALLBACK;
  }

  return null;
}

export function extractUserResponseText(rawText: string): string {
  const lines = rawText.split("\n");
  const nonQuotedLines = lines.filter((line) => !line.startsWith(">"));
  return nonQuotedLines.join("\n").trim();
}
