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

export function isStopMessage(text: string): boolean {
  const normalizedText = text.trim().toUpperCase();
  return normalizedText === "STOP" || normalizedText === "ARRET" || normalizedText === "ARRÊT";
}

export function parseUserResponse(text: string): IUserResponseType | null {
  const normalizedText = text
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/\u00B7/g, "·"); // normaliser le point médian

  const exactNoHelp = ["je ne veux pas d'aide", "je ne veux pas d aide", "non", "2", "❌"];

  const exactCallback = [
    "je veux être recontacté·e",
    "je veux etre recontacte·e",
    "je veux être recontactée",
    "je veux être recontacté",
    "je veux etre recontactee",
    "je veux etre recontacte",
    "oui",
    "1",
    "📞",
  ];

  if (exactNoHelp.includes(normalizedText)) {
    return USER_RESPONSE_TYPE.NO_HELP;
  }

  if (exactCallback.includes(normalizedText)) {
    return USER_RESPONSE_TYPE.CALLBACK;
  }

  return null;
}

export function extractUserResponseText(rawText: string): string {
  const lines = rawText.split("\n");
  const nonQuotedLines = lines.filter((line) => !line.startsWith(">"));
  return nonQuotedLines.join("\n").trim();
}
