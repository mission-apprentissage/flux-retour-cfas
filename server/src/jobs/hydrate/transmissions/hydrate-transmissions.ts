import { captureException } from "@sentry/node";
import { ObjectId } from "bson";

import {
  getAllErrorsTransmissionStatusGroupedByOrganismeForAGivenDay,
  getAllTransmissionsDate,
} from "@/common/actions/indicateurs/transmissions/transmission.action";
import { transmissionDailyReportDb } from "@/common/model/collections";
import { formatDateYYYYMMDD } from "@/common/utils/dateUtils";

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

export const computeDailyTransmissions = async () => {
  const previousDay = new Date();
  previousDay.setDate(previousDay.getDate() - 1);

  await insertTransmissions(previousDay);
};

export const hydrateAllTransmissions = async () => {
  const allDates = await getAllTransmissionsDate();
  console.log("All transmission dates:", allDates);
  if (!allDates || allDates.length === 0) {
    captureException(new Error("No transmission dates found."));
    console.error("No transmission dates found.");
    return;
  }
  for (const date of allDates) {
    if (!date) {
      console.error("Invalid date found in transmission dates:", date);
      continue;
    }
    try {
      await insertTransmissions(new Date(date));
    } catch (error) {
      captureException(error);
      console.error(`Error processing date ${date}:`, error);
    }
  }
};
