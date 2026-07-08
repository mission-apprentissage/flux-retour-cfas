import { ObjectId } from "bson";

import { usersMigrationDb } from "@/common/model/collections";

import { BrevoEventDefinition } from "./types";

/**
 * Événement émis lorsqu'un compte utilisateur passe à CONFIRMED. Capté par un
 * scénario d'automation côté Brevo (contact identifié par email).
 *
 * Payload minimal (choix métier)
 */
export const accountConfirmedEvent: BrevoEventDefinition = {
  key: "account-confirmed",
  eventName: "account_confirmed",
  buildPayload: async ({ userId }) => {
    const user = await usersMigrationDb().findOne({ _id: new ObjectId(userId) });
    if (!user?.email) return null;

    return {
      identifiers: { emailId: user.email },
      // event_date = date du passage à CONFIRMED (confirmed_at, posé par tous les chemins
      // de confirmation). Absent -> Brevo horodate à la réception (le champ est facultatif).
      ...(user.confirmed_at ? { eventDate: user.confirmed_at.toISOString() } : {}),
    };
  },
};
