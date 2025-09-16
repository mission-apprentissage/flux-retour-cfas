"use client";

import Image from "next/image";
import { memo } from "react";
import { IEffecifMissionLocale, SITUATION_ENUM } from "shared";

import { formatDate } from "@/app/_utils/date.utils";

import styles from "../shared/ui/EffectifParcours.module.css";

const TIMELINE_EVENTS = {
  RUPTURE: "RUPTURE",
  TRAITE_CFA: "TRAITE_CFA",
  TRAITE_CFA_SUIVI: "TRAITE_CFA_SUIVI",
  TRAITE_CFA_PARTAGE: "TRAITE_CFA_PARTAGE",
  EN_COURS_ML: "EN_COURS_ML",
  CONTACTE_SANS_REPONSE: "CONTACTE_SANS_REPONSE",
  TRAITE_ML_NOUVELLE_SITUATION: "TRAITE_ML_NOUVELLE_SITUATION",
  TRAITE_ML: "TRAITE_ML",
} as const;

const EVENT_LABELS = {
  [TIMELINE_EVENTS.RUPTURE]: "Rupture du contrat d'apprentissage",
  [TIMELINE_EVENTS.TRAITE_CFA]: "Dossier traité",
  [TIMELINE_EVENTS.TRAITE_CFA_SUIVI]: "Dossier traité - suivi par le CFA",
  [TIMELINE_EVENTS.TRAITE_CFA_PARTAGE]: "Dossier traité - partagé à la Mission Locale",
  [TIMELINE_EVENTS.EN_COURS_ML]: "Dossier en cours de traitement par la Mission Locale",
  [TIMELINE_EVENTS.CONTACTE_SANS_REPONSE]: "Contacté sans réponse par la Mission Locale",
  [TIMELINE_EVENTS.TRAITE_ML_NOUVELLE_SITUATION]: "Dossier traité - Nouvelle situation",
  [TIMELINE_EVENTS.TRAITE_ML]: "Dossier traité par la Mission Locale",
} as const;

type TimelineEventType = (typeof TIMELINE_EVENTS)[keyof typeof TIMELINE_EVENTS];

interface TimelineEvent {
  date: Date;
  type: TimelineEventType;
  label: string;
}

interface EffectifParcoursProps {
  effectif: IEffecifMissionLocale["effectif"];
  className?: string;
}

const buildTimeline = (effectif: IEffecifMissionLocale["effectif"]): TimelineEvent[] => {
  const events: TimelineEvent[] = [];
  const eff = effectif as any;

  if (effectif.date_rupture) {
    const ruptureDate = effectif.date_rupture?.date || effectif.date_rupture;
    events.push({
      date: ruptureDate instanceof Date ? ruptureDate : new Date(ruptureDate),
      type: TIMELINE_EVENTS.RUPTURE,
      label: EVENT_LABELS[TIMELINE_EVENTS.RUPTURE],
    });
  }

  if ("organisme_data" in effectif) {
    const reponseDate = eff.organisme_data.reponse_at;
    const date = reponseDate instanceof Date ? reponseDate : new Date(reponseDate);

    if (eff.organisme_data.rupture === false) {
      events.push({
        date,
        type: TIMELINE_EVENTS.TRAITE_CFA,
        label: EVENT_LABELS[TIMELINE_EVENTS.TRAITE_CFA],
      });
    } else if (eff.organisme_data.rupture === true && eff.organisme_data.acc_conjoint === false) {
      events.push({
        date,
        type: TIMELINE_EVENTS.TRAITE_CFA_SUIVI,
        label: EVENT_LABELS[TIMELINE_EVENTS.TRAITE_CFA_SUIVI],
      });
    } else if (eff.organisme_data.rupture === true && eff.organisme_data.acc_conjoint === true) {
      events.push({
        date,
        type: TIMELINE_EVENTS.TRAITE_CFA_PARTAGE,
        label: EVENT_LABELS[TIMELINE_EVENTS.TRAITE_CFA_PARTAGE],
      });
    }
  }

  if (
    "organisme_data" in effectif &&
    eff.organisme_data?.acc_conjoint === true &&
    "mission_locale_logs" in effectif &&
    eff.mission_locale_logs
  ) {
    eff.mission_locale_logs.forEach((log: any) => {
      if (log.created_at && log.situation) {
        const date = log.created_at instanceof Date ? log.created_at : new Date(log.created_at);

        if (log.situation === SITUATION_ENUM.NOUVEAU_PROJET) {
          events.push({
            date,
            type: TIMELINE_EVENTS.TRAITE_ML_NOUVELLE_SITUATION,
            label: EVENT_LABELS[TIMELINE_EVENTS.TRAITE_ML_NOUVELLE_SITUATION],
          });
        } else if (log.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR) {
          events.push({
            date,
            type: TIMELINE_EVENTS.CONTACTE_SANS_REPONSE,
            label: EVENT_LABELS[TIMELINE_EVENTS.CONTACTE_SANS_REPONSE],
          });
        } else {
          events.push({
            date,
            type: TIMELINE_EVENTS.TRAITE_ML,
            label: EVENT_LABELS[TIMELINE_EVENTS.TRAITE_ML],
          });
        }
      }
    });
  }

  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
};

const getIcon = (type: TimelineEventType) => {
  if (type === TIMELINE_EVENTS.RUPTURE) {
    return <Image src="/images/parcours-rupture.svg" alt="Rupture du contrat" width={20} height={20} />;
  }
  if (
    [
      TIMELINE_EVENTS.TRAITE_CFA,
      TIMELINE_EVENTS.TRAITE_CFA_SUIVI,
      TIMELINE_EVENTS.TRAITE_ML,
      TIMELINE_EVENTS.TRAITE_ML_NOUVELLE_SITUATION,
    ].includes(type as any)
  ) {
    return <Image src="/images/parcours-dossier-traite.svg" alt="Dossier traité" width={18} height={18} />;
  }
  if (type === TIMELINE_EVENTS.TRAITE_CFA_PARTAGE) {
    return (
      <Image
        src="/images/parcours-partage-mission-locale.svg"
        alt="Partagé à la Mission Locale"
        width={18}
        height={18}
      />
    );
  }
  if (type === TIMELINE_EVENTS.EN_COURS_ML) {
    return <Image src="/images/parcours-en-cours-traitement.svg" alt="En cours de traitement" width={17} height={17} />;
  }
  if (type === TIMELINE_EVENTS.CONTACTE_SANS_REPONSE) {
    return (
      <Image src="/images/parcours-contacte-sans-reponse.svg" alt="Contacté sans réponse" width={18} height={17} />
    );
  }
  return (
    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--text-disabled-grey)" }} />
  );
};

export const EffectifParcoursCfa = memo(function EffectifParcours({ effectif, className }: EffectifParcoursProps) {
  const timeline = buildTimeline(effectif);

  if (timeline.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.parcours} ${className || ""}`}>
      <h3 className={styles.parcoursTitle}>Parcours</h3>
      <div className={styles.timeline}>
        {timeline.map((event) => (
          <div key={`${event.type}-${event.date.getTime()}`} className={styles.timelineItem}>
            <div className={styles.timelineIcon}>{getIcon(event.type)}</div>
            <div className={styles.timelineContent}>
              <p className={styles.timelineText}>
                Le {formatDate(event.date)} : <strong>{event.label}</strong>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
