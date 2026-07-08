import { accountConfirmedEvent } from "./account-confirmed.event";
import { BrevoEventDefinition } from "./types";

// Registre des événements Brevo par clé d'usecase.
// Pour ajouter un événement : importer sa définition et l'enregistrer ci-dessous.
export const brevoEventRegistry: Record<string, BrevoEventDefinition> = {
  [accountConfirmedEvent.key]: accountConfirmedEvent,
};

export const getBrevoEvent = (key: string): BrevoEventDefinition => {
  const def = brevoEventRegistry[key];
  if (!def) {
    throw new Error(`Unknown Brevo event: ${key}`);
  }
  return def;
};
