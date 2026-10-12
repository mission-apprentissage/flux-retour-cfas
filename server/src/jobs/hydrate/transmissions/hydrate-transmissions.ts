import { ObjectId } from "bson";

import {
  getAllErrorsTransmissionStatusGroupedByOrganismeForAGivenDay,
  getAllTransmissionsDate,
} from "@/common/actions/indicateurs/transmissions/transmission.action";
import logger from "@/common/logger";
import { transmissionDailyReportDb } from "@/common/model/collections";
import { formatDateYYYYMMDD } from "@/common/utils/dateUtils";
import { createErrorAggregator } from "@/common/utils/errorAggregator";

const insertTransmissions = async (date: Date) => {
  const formattedDay = formatDateYYYYMMDD(date);

  if (!formattedDay) {
    throw new Error("Invalid date format");
  }

  const data = await getAllErrorsTransmissionStatusGroupedByOrganismeForAGivenDay(date);
  await transmissionDailyReportDb().insertMany(
    data.map((item) => ({
      _id: new ObjectId(),
      organisme_id: item.organisme_id,
      current_day: formattedDay,
      success_count: item.success,
      error_count: item.error,
    }))
  );
};

const deleteTransmissions = async (date: Date) => {
  const formattedDay = formatDateYYYYMMDD(date);
  if (!formattedDay) {
    throw new Error("Invalid date format");
  }
  const result = await transmissionDailyReportDb().deleteMany({ current_day: formattedDay });
  if (result.deletedCount === 0) {
    logger.info(`No transmissions found for date: ${formattedDay}`);
  }
  return result;
};

export const computeDailyTransmissions = async () => {
  const previousDay = new Date();
  previousDay.setDate(previousDay.getDate() - 1);

  await insertTransmissions(previousDay);
};

export const hydrateAllTransmissions = async () => {
  const allDates = await getAllTransmissionsDate();

  if (!allDates || allDates.length === 0) {
    logger.warn("Aucune date de transmission trouvée");
    return;
  }

  const errors = createErrorAggregator("hydrate-transmissions");
  for (const date of allDates) {
    if (!date) {
      logger.warn({ date }, "Date invalide dans les dates de transmission");
      continue;
    }
    try {
      await insertTransmissions(new Date(date));
      errors.ok();
    } catch (error) {
      logger.error({ err: error, date }, "Erreur lors du traitement de la date de transmission");
      errors.record(error);
    }
  }
  errors.finish();
};

export const forceHydrateAllTransmissions = async () => {
  const allDates = await getAllTransmissionsDate();

  const errors = createErrorAggregator("force-hydrate-transmissions");
  for (const date of allDates) {
    if (!date) {
      logger.warn({ date }, "Date invalide dans les dates de transmission");
      continue;
    }
    const today = new Date();
    if (date === formatDateYYYYMMDD(today)) {
      logger.warn({ date }, "Date du jour ignorée");
      continue;
    }

    try {
      await deleteTransmissions(new Date(date));
      await insertTransmissions(new Date(date));
      errors.ok();
    } catch (error) {
      logger.error({ err: error, date }, "Erreur lors du traitement de la date de transmission");
      errors.record(error);
    }
  }
  errors.finish();
};
