import type { UpdateFilter } from "mongodb";
import type { IUsersMigration } from "shared/models";

import logger from "@/common/logger";
import { usersMigrationDb } from "@/common/model/collections";

const JOUR_MS = 24 * 60 * 60 * 1000;
const JOURS_HISTORIQUE_CONNEXION = 365;
const JOURS_COURRIELS = 365;
const JOURS_CHARGE_COURRIEL = 30;

const joursAvant = (date: Date, jours: number) => new Date(date.getTime() - jours * JOUR_MS);

export const purgeTraces = async (maintenant = new Date()) => {
  const limiteConnexions = joursAvant(maintenant, JOURS_HISTORIQUE_CONNEXION);
  const limiteCourriels = joursAvant(maintenant, JOURS_COURRIELS);
  const limiteCharges = joursAvant(maintenant, JOURS_CHARGE_COURRIEL);

  const connexionAncienne = { $lt: limiteConnexions };
  const retraitConnexions = { $pull: { connection_history: connexionAncienne } } as UpdateFilter<IUsersMigration>;
  const connexions = await usersMigrationDb().updateMany({ connection_history: connexionAncienne }, retraitConnexions);

  const courrielAncien = { sendDates: { $not: { $gte: limiteCourriels } } };
  const courriels = await usersMigrationDb().updateMany(
    { emails: { $elemMatch: courrielAncien } },
    { $pull: { emails: courrielAncien } }
  );

  const chargeAncienne = { payload: { $exists: true }, sendDates: { $not: { $gte: limiteCharges } } };
  const charges = await usersMigrationDb().updateMany(
    { emails: { $elemMatch: chargeAncienne } },
    { $unset: { "emails.$[e].payload": "" } },
    { arrayFilters: [{ "e.payload": chargeAncienne.payload, "e.sendDates": chargeAncienne.sendDates }] }
  );

  const comptes = {
    connection_history: connexions.modifiedCount,
    emails: courriels.modifiedCount,
    payload: charges.modifiedCount,
  };
  logger.info({ comptes }, "Purge des traces des comptes utilisateurs");
  return comptes;
};
