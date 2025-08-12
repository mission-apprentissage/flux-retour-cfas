"use client";

import { IUpdateMissionLocaleEffectif } from "shared";

import { formatDate } from "@/app/_utils/date.utils";

import { calculateDaysSince, formatContactTimeText } from "../../shared";
import { MissionLocaleFeedback } from "../feedback/MissionLocaleFeedback";

import styles from "./ContactHistory.module.css";

interface ContactHistoryProps {
  situation: IUpdateMissionLocaleEffectif;
  lastContactDate?: Date | string;
}

export function ContactHistory({ situation, lastContactDate }: ContactHistoryProps) {
  if (!situation.situation || !lastContactDate) {
    return null;
  }

  const contactDate = new Date(lastContactDate);
  const daysSince = calculateDaysSince(lastContactDate);
  const timeText = formatContactTimeText(daysSince);

  return (
    <div className={styles.container}>
      <h4 className={`fr-mb-3w ${styles.title}`}>
        Le {formatDate(contactDate)}, {timeText}
      </h4>
      <MissionLocaleFeedback situation={situation} visibility="MISSION_LOCALE" />
    </div>
  );
}
