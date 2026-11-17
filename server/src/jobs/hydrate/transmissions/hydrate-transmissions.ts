import { ObjectId } from "bson";

import { getAllErrorsTransmissionStatusGroupedByOrganismeForAGivenDay } from "@/common/actions/indicateurs/transmissions/transmission.action";
import { transmissionDailyReportDb } from "@/common/model/collections";
import { formatDateYYYYMMDD } from "@/common/utils/dateUtils";

const upsertTransmissions = async (date: Date) => {
  const formattedDay = formatDateYYYYMMDD(date);

  if (!formattedDay) {
    throw new Error("Invalid date format");
  }

  const data = await getAllErrorsTransmissionStatusGroupedByOrganismeForAGivenDay(date);
  if (data.length === 0) {
    return;
  }

  await transmissionDailyReportDb().bulkWrite(
    data.map((item) => ({
      updateOne: {
        filter: { organisme_id: item.organisme_id, current_day: formattedDay },
        update: {
          $set: { success_count: item.success, error_count: item.error },
          $setOnInsert: { _id: new ObjectId() },
        },
        upsert: true,
      },
    }))
  );
};

export const computeDailyTransmissions = async () => {
  const previousDay = new Date();
  previousDay.setDate(previousDay.getDate() - 1);

  await upsertTransmissions(previousDay);
};
