"use client";

import Image from "next/image";
import { memo } from "react";
import { IEffecifMissionLocale, SITUATION_ENUM } from "shared";

import { formatDate } from "@/app/_utils/date.utils";

import styles from "../shared/ui/EffectifParcours.module.css";

const TIMELINE_EVENTS = {
  RUPTURE: "RUPTURE",
  TRAITE_CFA: "TRAITE_CFA",
  CONTACTE_SANS_REPONSE: "CONTACTE_SANS_REPONSE",
  DOSSIER_PARTAGE_PAR_CFA: "DOSSIER_PARTAGE_PAR_CFA",
  NOUVEAU_CONTRAT: "NOUVEAU_CONTRAT",
} as const;

const EVENT_LABELS = {
  [TIMELINE_EVENTS.RUPTURE]: "Rupture du contrat d'apprentissage",
  [TIMELINE_EVENTS.TRAITE_CFA]: "Dossier traité",
  [TIMELINE_EVENTS.CONTACTE_SANS_REPONSE]: "Contacté sans réponse",
  [TIMELINE_EVENTS.DOSSIER_PARTAGE_PAR_CFA]: "Dossier partagé par le CFA",
  [TIMELINE_EVENTS.NOUVEAU_CONTRAT]: "Nouveau contrat d'apprentissage",
} as const;

type TimelineEventType = (typeof TIMELINE_EVENTS)[keyof typeof TIMELINE_EVENTS];

interface TimelineEvent {
  date: Date;
  type: TimelineEventType;
  label: string;
}

interface EffectifParcoursMissionLocaleProps {
  effectif: IEffecifMissionLocale["effectif"];
  className?: string;
}

const buildTimelineMissionLocale = (effectif: IEffecifMissionLocale["effectif"]): TimelineEvent[] => {
  const events: TimelineEvent[] = [];
  const eff = effectif as any;

  const hasNouveauContrat = "situation" in effectif && eff.situation?.situation === SITUATION_ENUM.NOUVEAU_PROJET;
  const hasContacteSansReponse =
    "situation" in effectif && eff.situation?.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR;

  if (effectif.date_rupture) {
    const ruptureDate = effectif.date_rupture?.date || effectif.date_rupture;
    events.push({
      date: ruptureDate instanceof Date ? ruptureDate : new Date(ruptureDate),
      type: TIMELINE_EVENTS.RUPTURE,
      label: EVENT_LABELS[TIMELINE_EVENTS.RUPTURE],
    });
  }

  if (
    !hasNouveauContrat &&
    !hasContacteSansReponse &&
    "mission_locale_logs" in effectif &&
    eff.mission_locale_logs &&
    eff.mission_locale_logs.length > 0
  ) {
    const traitementDate = eff.mission_locale_logs[0].created_at;
    const date = traitementDate instanceof Date ? traitementDate : new Date(traitementDate);

    events.push({
      date,
      type: TIMELINE_EVENTS.TRAITE_CFA,
      label: EVENT_LABELS[TIMELINE_EVENTS.TRAITE_CFA],
    });
  }

  if (hasContacteSansReponse) {
    const actionDate =
      ("mission_locale_logs" in effectif ? eff.mission_locale_logs?.[0]?.created_at : undefined) || new Date();
    const date = actionDate instanceof Date ? actionDate : new Date(actionDate);

    events.push({
      date,
      type: TIMELINE_EVENTS.CONTACTE_SANS_REPONSE,
      label: EVENT_LABELS[TIMELINE_EVENTS.CONTACTE_SANS_REPONSE],
    });
  }

  if ("organisme_data" in effectif && eff.organisme_data?.acc_conjoint === true && eff.organisme_data?.reponse_at) {
    const partageDate = eff.organisme_data.reponse_at;
    const date = partageDate instanceof Date ? partageDate : new Date(partageDate);

    events.push({
      date,
      type: TIMELINE_EVENTS.DOSSIER_PARTAGE_PAR_CFA,
      label: EVENT_LABELS[TIMELINE_EVENTS.DOSSIER_PARTAGE_PAR_CFA],
    });
  }

  if (hasNouveauContrat) {
    const actionDate =
      ("mission_locale_logs" in effectif ? eff.mission_locale_logs?.[0]?.created_at : undefined) || new Date();
    const date = actionDate instanceof Date ? actionDate : new Date(actionDate);

    events.push({
      date,
      type: TIMELINE_EVENTS.NOUVEAU_CONTRAT,
      label: EVENT_LABELS[TIMELINE_EVENTS.NOUVEAU_CONTRAT],
    });
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
};

const getIcon = (type: TimelineEventType) => {
  if (type === TIMELINE_EVENTS.RUPTURE) {
    return <Image src="/images/parcours-rupture.svg" alt="Rupture du contrat" width={20} height={20} />;
  }
  if (type === TIMELINE_EVENTS.TRAITE_CFA) {
    return <Image src="/images/parcours-dossier-traite.svg" alt="Dossier traité" width={18} height={18} />;
  }
  if (type === TIMELINE_EVENTS.DOSSIER_PARTAGE_PAR_CFA) {
    return <Image src="/images/parcours-partage-mission-locale.svg" alt="Dossier partagé" width={18} height={18} />;
  }
  if (type === TIMELINE_EVENTS.CONTACTE_SANS_REPONSE) {
    return (
      <Image src="/images/parcours-contacte-sans-reponse.svg" alt="Contacté sans réponse" width={18} height={17} />
    );
  }
  if (type === TIMELINE_EVENTS.NOUVEAU_CONTRAT) {
    return <Image src="/images/parcours-dossier-traite.svg" alt="Nouveau contrat" width={18} height={18} />;
  }
  return (
    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--text-disabled-grey)" }} />
  );
};

export const EffectifParcoursMissionLocale = memo(function EffectifParcoursMissionLocale({
  effectif,
  className,
}: EffectifParcoursMissionLocaleProps) {
  const timeline = buildTimelineMissionLocale(effectif);

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
