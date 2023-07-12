import { PromisePool } from "@supercharge/promise-pool";
import { addDays, differenceInDays, isAfter } from "date-fns";

import { getAllContrats } from "@/common/apis/apiDeca";
import parentLogger from "@/common/logger";
import { contratsDecaDb } from "@/common/model/collections";
import { __dirname } from "@/common/utils/esmUtils";

const logger = parentLogger.child({ module: "job:hydrate:contratsDeca" });
const DATE_DEBUT_CONTRATS_DISPONIBLES = new Date("2022-01-01T00:00:00.000Z"); // Date de début de disponibilité des données dans l'API Deca
const NB_JOURS_MAX_PERIODE_FETCH = 59; // Nombre de jours maximum que l'on peut récupérer via un appel à l'API Deca

/**
 * Ce job peuple la collection contratsDeca via l'API Deca
 * L'API Deca ne permets de récupérer des données que sur une période maximum NB_JOURS_MAX_PERIODE_FETCH
 * L'API Deca ne permets de récupérer des données que jusqu'a "hier" au plus tard.
 * Le job va récupérer les données en découpant par chunks de NB_JOURS_MAX_PERIODE_FETCH jours si besoin via 2 modes :
 *    - incrémental (si aucune option spécifiée) : depuis la date la plus récente des contratsDecaDb en base jusqu'à "hier"
 *    - full : depuis DATE_DEBUT_CONTRATS_DISPONIBLES jusqu'à "hier"
 * -- Option drop : supprime les données contratsDecaDb existantes
 */
export const hydrateDeca = async ({ drop, full } = { drop: false, full: false }) => {
  if (drop) {
    logger.info("Clear de la collection contratsDeca ...");
    await contratsDecaDb().deleteMany({});
  }

  // Récupération de la date début / fin en fonction de l'option full et des données en base
  const dateFinToFetch = addDays(new Date(), -1);
  const dateDebutToFetch: Date = full
    ? DATE_DEBUT_CONTRATS_DISPONIBLES
    : (await getLastDecaCreatedDateInDb()) ?? DATE_DEBUT_CONTRATS_DISPONIBLES;

  logger.info(
    `Récupération des contrats depuis l'API Deca du ${dateDebutToFetch.toLocaleDateString()} au ${dateFinToFetch.toLocaleDateString()} ...`
  );

  // Récupération des périodes (liste dateDebut/fin) à fetch dans l'API
  const periods = buildPeriodsToFetch(dateDebutToFetch, dateFinToFetch);

  await PromisePool.for(periods).process(async ({ dateDebut, dateFin }: { dateDebut: Date; dateFin: Date }) => {
    try {
      logger.info(`> Fetch des données Deca du ${dateDebut.toLocaleDateString()} au ${dateFin.toLocaleDateString()}`);
      const decaContratsForPeriod = await getAllContrats(dateDebut, dateFin);

      logger.info(
        `Insertion des ${
          decaContratsForPeriod.length
        } contrats dans la collection contratsDeca du ${dateDebut.toLocaleDateString()} au ${dateFin.toLocaleDateString()} `
      );
      await PromisePool.for(decaContratsForPeriod).process(async (currentContrat) => {
        await contratsDecaDb().insertOne({ ...currentContrat, created_at: new Date() });
      });
    } catch (err: any) {
      throw new Error(`Erreur lors de la récupération des données Deca : ${JSON.stringify(err)}`);
    }
  });

  logger.info("Collection contratsDeca initialisée avec succès !");
};

/**
 * Récupération de la liste des périodes (dateDébut - dateFin) par chunk de NB_JOURS_MAX_PERIODE_FETCH
 * L'API Deca ne permets de récupérer des données que sur un période max de NB_JOURS_MAX_PERIODE_FETCH,
 * on devra l'appeler plusieurs fois si la durée que l'on souhaite est > NB_JOURS_MAX_PERIODE_FETCH
 */
const buildPeriodsToFetch = (dateDebut: Date, dateFin: Date): Array<{ dateDebut: Date; dateFin: Date }> => {
  const periods: Array<{ dateDebut: Date; dateFin: Date }> = [];
  const nbDaysBetweenDebutFin = differenceInDays(dateFin, dateDebut);

  if (nbDaysBetweenDebutFin < NB_JOURS_MAX_PERIODE_FETCH) {
    periods.push({ dateDebut, dateFin });
  } else {
    let currentDate = dateDebut;
    while (currentDate <= dateFin) {
      // Si la date de fin de période est dans le futur on remplace par au plus tard à la date d'hier
      const dateFinPeriod = isAfter(addDays(currentDate, NB_JOURS_MAX_PERIODE_FETCH), new Date())
        ? addDays(new Date(), -1)
        : addDays(currentDate, NB_JOURS_MAX_PERIODE_FETCH);
      periods.push({ dateDebut: currentDate, dateFin: dateFinPeriod });
      currentDate = addDays(currentDate, NB_JOURS_MAX_PERIODE_FETCH + 1);
    }
  }

  return periods;
};

/**
 * Fonction de récupération de la dernière date de contrat Deca ajouté en base
 * @returns
 */
const getLastDecaCreatedDateInDb = async (): Promise<Date | null> => {
  const lastDecaItem = await contratsDecaDb().find().sort({ created_at: -1 }).limit(1).toArray();

  let lastCreatedAt = lastDecaItem[0]?.created_at ?? null;
  // Si la dernière date est plus tard qu'hier, on prend hier en date de référence
  if (lastCreatedAt && isAfter(lastCreatedAt, addDays(new Date(), -1))) lastCreatedAt = addDays(new Date(), -1);
  return lastCreatedAt;
};
