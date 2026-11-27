import type { Filter, UpdateFilter } from "mongodb";
import type { IUsersMigration } from "shared/models";

import logger from "@/common/logger";
import { usersMigrationDb } from "@/common/model/collections";

const JOUR_MS = 24 * 60 * 60 * 1000;
const JOURS_HISTORIQUE_CONNEXION = 365;
const JOURS_COURRIELS = 365;
const JOURS_CHARGE_COURRIEL = 30;

const joursAvant = (date: Date, jours: number) => new Date(date.getTime() - jours * JOUR_MS);

export const purgeTraces = async (maintenant = new Date(), { simulation = false }: { simulation?: boolean } = {}) => {
  const limiteConnexions = joursAvant(maintenant, JOURS_HISTORIQUE_CONNEXION);
  const limiteCourriels = joursAvant(maintenant, JOURS_COURRIELS);
  const limiteCharges = joursAvant(maintenant, JOURS_CHARGE_COURRIEL);

  const connexionAncienne = { $lt: limiteConnexions };
  const courrielAncien = { sendDates: { $not: { $gte: limiteCourriels } } };
  const chargeAncienne = { payload: { $exists: true }, sendDates: { $not: { $gte: limiteCharges } } };

  const filtreConnexions = { connection_history: connexionAncienne } as Filter<IUsersMigration>;
  const filtreCourriels = { emails: { $elemMatch: courrielAncien } } as Filter<IUsersMigration>;
  const filtreCharges = { emails: { $elemMatch: chargeAncienne } } as Filter<IUsersMigration>;

  if (simulation) {
    const comptes = {
      connection_history: await usersMigrationDb().countDocuments(filtreConnexions),
      emails: await usersMigrationDb().countDocuments(filtreCourriels),
      payload: await usersMigrationDb().countDocuments(filtreCharges),
    };
    logger.warn({ comptes }, "Purge des traces des comptes utilisateurs désactivée, comptes concernés");
    return comptes;
  }

  const retraitConnexions = { $pull: { connection_history: connexionAncienne } } as UpdateFilter<IUsersMigration>;
  const connexions = await usersMigrationDb().updateMany(filtreConnexions, retraitConnexions);

  const courriels = await usersMigrationDb().updateMany(filtreCourriels, { $pull: { emails: courrielAncien } });

  const charges = await usersMigrationDb().updateMany(
    filtreCharges,
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
