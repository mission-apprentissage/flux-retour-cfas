import { ObjectId } from "bson";

import { organisationsDb, usersMigrationDb } from "@/common/model/collections";

import { formatEmail } from "../contacts/formatters";
import { isBrevoMlGenericContactsActive } from "../contacts/sync-settings.actions";

import { BrevoEventDefinition } from "./types";

/**
 * Variante de `account-confirmed` ciblant l'adresse générique de la Mission
 * Locale plutôt que l'utilisateur lui-même.
 *
 * Cette adresse est démarchée par les campagnes d'acquisition, mais les agents
 * s'inscrivent avec leur propre adresse nominative : sans cet événement, le
 * contact générique ne sort jamais du scénario de relance. Même `eventName` que
 * `account-confirmed`, donc capté par l'automation existante.
 *
 * L'appelant est responsable de ne l'émettre que sur la transition
 * inactive → active (cf. `isMissionLocaleActivated`).
 */
export const accountConfirmedMlGenericEvent: BrevoEventDefinition = {
  key: "account-confirmed-ml-generic",
  eventName: "account_confirmed",
  buildPayload: async ({ userId }) => {
    // Garde portée ici plutôt qu'aux points d'appel : couper le toggle doit
    // éteindre la fonctionnalité entière, sans dépendre de chaque appelant.
    if (!(await isBrevoMlGenericContactsActive())) return null;

    const user = await usersMigrationDb().findOne({ _id: new ObjectId(userId) });
    if (!user?.email) return null;

    const organisation = await organisationsDb().findOne({ _id: user.organisation_id, type: "MISSION_LOCALE" });
    const genericEmail = (organisation as { email?: string } | null)?.email;
    if (!genericEmail) return null;

    // Adresse générique déjà portée par ce compte : `account-confirmed` couvre
    // le cas, émettre ici produirait un doublon.
    if (formatEmail(genericEmail) === formatEmail(user.email)) return null;

    return {
      identifiers: { emailId: formatEmail(genericEmail) },
      ...(user.confirmed_at ? { eventDate: user.confirmed_at.toISOString() } : {}),
    };
  },
};
