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

const MAX_REPLAY_DAYS = 14;

const parseReplayDay = (day: string): Date => {
  const date = new Date(`${day}T12:00:00`);
  if (Number.isNaN(date.getTime()) || formatDateYYYYMMDD(date) !== day) {
    throw new Error(`Option day invalide : date AAAA-MM-JJ attendue, reçu ${day}`);
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const ageInDays = Math.round((today.getTime() - date.getTime()) / 86_400_000);
  if (ageInDays < 1 || ageInDays > MAX_REPLAY_DAYS) {
    throw new Error(
      `Option day refusée : ${day} doit être entre la veille et il y a ${MAX_REPLAY_DAYS} jours, au-delà la purge a pu retirer une partie des transmissions`
    );
  }
  return date;
};

export const computeDailyTransmissions = async ({ day }: { day?: string } = {}) => {
  if (day) {
    await upsertTransmissions(parseReplayDay(day));
    return;
  }

  const previousDay = new Date();
  previousDay.setDate(previousDay.getDate() - 1);

  await upsertTransmissions(previousDay);
};
