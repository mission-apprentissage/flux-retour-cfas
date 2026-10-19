import type { ObjectId } from "bson";

import { organisationsDb } from "@/common/model/collections";
import type { AuthContext } from "@/common/model/internal/AuthContext";

const DELAI_MIN_ENTRE_ECRITURES_MS = 5 * 60 * 1000;

/**
 * Dernière activité réelle d'une ML ou d'un CFA (consultation d'une fiche jeune, envoi d'une collaboration).
 * Réécrite au plus toutes les 5 minutes, le front relançant la requête à chaque retour sur la fiche ;
 * l'imposture d'un administrateur ne compte pas.
 */
export async function enregistrerActiviteOrganisation(
  ctx: Pick<AuthContext, "impersonating"> | undefined,
  organisationId: ObjectId | undefined,
  now: Date = new Date()
) {
  if (!ctx || ctx.impersonating || !organisationId) return;
  await organisationsDb().updateOne(
    {
      _id: organisationId,
      type: { $in: ["MISSION_LOCALE", "ORGANISME_FORMATION"] },
      $or: [
        { derniere_activite: { $exists: false } },
        { derniere_activite: null },
        { derniere_activite: { $lt: new Date(now.getTime() - DELAI_MIN_ENTRE_ECRITURES_MS) } },
      ],
    },
    { $set: { derniere_activite: now } }
  );
}
