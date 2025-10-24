"use client";

import Image from "next/image";
import { memo } from "react";

import { formatDate } from "@/app/_utils/date.utils";

import styles from "../ruptures/shared/ui/EffectifParcours.module.css";

import { IEffectifDetail } from "./types";

const TIMELINE_EVENTS = {
  DEMARRAGE_FORMATION: "DEMARRAGE_FORMATION",
  CONTACTE_CONSEILLER: "CONTACTE_CONSEILLER",
  DOSSIER_TRAITE: "DOSSIER_TRAITE",
} as const;

const EVENT_LABELS = {
  [TIMELINE_EVENTS.DEMARRAGE_FORMATION]: "Démarrage de la formation en CFA",
  [TIMELINE_EVENTS.CONTACTE_CONSEILLER]: "Contacté par un conseiller France Travail",
  [TIMELINE_EVENTS.DOSSIER_TRAITE]: "Dossier traité",
} as const;

const EVENT_PRIORITY = {
  [TIMELINE_EVENTS.DOSSIER_TRAITE]: 1,
  [TIMELINE_EVENTS.CONTACTE_CONSEILLER]: 2,
  [TIMELINE_EVENTS.DEMARRAGE_FORMATION]: 3,
} as const;

type TimelineEventType = (typeof TIMELINE_EVENTS)[keyof typeof TIMELINE_EVENTS];

interface TimelineEvent {
  date: Date;
  type: TimelineEventType;
  label: string;
  subtitle?: string;
}

interface FTEffectifParcoursProps {
  effectif: IEffectifDetail;
  codeSecteur?: number;
  className?: string;
}

const buildTimeline = (effectif: IEffectifDetail): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  if (effectif.date_inscription) {
    events.push({
      date: new Date(effectif.date_inscription),
      type: TIMELINE_EVENTS.DEMARRAGE_FORMATION,
      label: EVENT_LABELS[TIMELINE_EVENTS.DEMARRAGE_FORMATION],
      subtitle: "Données transmises par le CFA",
    });
  }

  if (effectif.ft_data && Object.keys(effectif.ft_data).length > 0) {
    const allCreatedDates = Object.values(effectif.ft_data)
      .filter((data): data is NonNullable<typeof data> => data?.created_at != null)
      .map((data) => new Date(data.created_at));

    if (allCreatedDates.length > 0) {
      const oldestDate = new Date(Math.min(...allCreatedDates.map((d) => d.getTime())));
      events.push({
        date: oldestDate,
        type: TIMELINE_EVENTS.DOSSIER_TRAITE,
        label: EVENT_LABELS[TIMELINE_EVENTS.DOSSIER_TRAITE],
      });
      events.push({
        date: oldestDate,
        type: TIMELINE_EVENTS.CONTACTE_CONSEILLER,
        label: EVENT_LABELS[TIMELINE_EVENTS.CONTACTE_CONSEILLER],
      });
    }
  }

  return events.sort((a, b) => {
    const dateDiff = b.date.getTime() - a.date.getTime();
    if (dateDiff !== 0) return dateDiff;
    return EVENT_PRIORITY[a.type] - EVENT_PRIORITY[b.type];
  });
};

const getIcon = (type: TimelineEventType) => {
  if (type === TIMELINE_EVENTS.DOSSIER_TRAITE) {
    return <Image src="/images/parcours-dossier-traite.svg" alt="Dossier traité" width={18} height={18} />;
  }
  if (type === TIMELINE_EVENTS.CONTACTE_CONSEILLER) {
    return (
      <Image
        src="/images/parcours-france-travail-contact.svg"
        alt="Contacté par un conseiller France Travail"
        width={20}
        height={20}
      />
    );
  }
  if (type === TIMELINE_EVENTS.DEMARRAGE_FORMATION) {
    return (
      <div
        style={{
          width: "20px",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <i className="ri-calendar-event-line" style={{ fontSize: "20px" }} />
      </div>
    );
  }
  return (
    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--text-disabled-grey)" }} />
  );
};

export const FTEffectifParcours = memo(function FTEffectifParcours({ effectif, className }: FTEffectifParcoursProps) {
  const timeline = buildTimeline(effectif);

  if (timeline.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.parcours} ${className || ""}`}>
      <h3 className={styles.parcoursTitle}>Parcours jeune</h3>
      <div className={styles.timeline}>
        {timeline.map((event) => (
          <div key={`${event.type}-${event.date.getTime()}`} className={styles.timelineItem}>
            <div className={styles.timelineIcon}>{getIcon(event.type)}</div>
            <div className={styles.timelineContent}>
              <p className={styles.timelineText}>
                Le {formatDate(event.date)} : <strong>{event.label}</strong>
              </p>
              {event.subtitle && (
                <p
                  className={styles.timelineText}
                  style={{ fontStyle: "italic", marginTop: "0.25rem", fontSize: "0.75rem" }}
                >
                  {event.subtitle}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
