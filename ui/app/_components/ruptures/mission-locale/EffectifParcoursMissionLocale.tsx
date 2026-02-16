"use client";

import Image from "next/image";
import { memo } from "react";
import { IEffectifMissionLocale, SITUATION_ENUM } from "shared";

import { formatDate } from "@/app/_utils/date.utils";

import styles from "../shared/ui/EffectifParcours.module.css";

const TIMELINE_EVENTS = {
  RUPTURE: "RUPTURE",
  TRAITE_CFA: "TRAITE_CFA",
  CONTACTE_SANS_REPONSE: "CONTACTE_SANS_REPONSE",
  DOSSIER_PARTAGE_PAR_CFA: "DOSSIER_PARTAGE_PAR_CFA",
  NOUVEAU_CONTRAT: "NOUVEAU_CONTRAT",
  NOUVEAU_PROJET: "NOUVEAU_PROJET",
  WHATSAPP_ENVOYE: "WHATSAPP_ENVOYE",
  WHATSAPP_ECHEC: "WHATSAPP_ECHEC",
  WHATSAPP_CALLBACK: "WHATSAPP_CALLBACK",
  WHATSAPP_NO_HELP: "WHATSAPP_NO_HELP",
} as const;

const EVENT_LABELS = {
  [TIMELINE_EVENTS.RUPTURE]: "Rupture du contrat d'apprentissage",
  [TIMELINE_EVENTS.TRAITE_CFA]: "Dossier traité",
  [TIMELINE_EVENTS.CONTACTE_SANS_REPONSE]: "Contacté sans réponse",
  [TIMELINE_EVENTS.DOSSIER_PARTAGE_PAR_CFA]: "Dossier partagé par le CFA",
  [TIMELINE_EVENTS.NOUVEAU_CONTRAT]: "Le jeune a débuté un nouveau contrat",
  [TIMELINE_EVENTS.NOUVEAU_PROJET]: "Nouveau projet en cours",
  [TIMELINE_EVENTS.WHATSAPP_ENVOYE]: "Message WhatsApp envoyé",
  [TIMELINE_EVENTS.WHATSAPP_ECHEC]: "Échec de l'envoi du message WhatsApp",
  [TIMELINE_EVENTS.WHATSAPP_CALLBACK]: "Le jeune a indiqué vouloir être recontacté par la Mission locale",
  [TIMELINE_EVENTS.WHATSAPP_NO_HELP]: "Le jeune a indiqué ne pas vouloir être recontacté par la Mission locale",
} as const;

const WhatsAppIcon = ({ color }: { color: string }) => (
  <i className="ri-whatsapp-fill" style={{ color, fontSize: "20px" }} aria-hidden="true" />
);

type TimelineEventType = (typeof TIMELINE_EVENTS)[keyof typeof TIMELINE_EVENTS];

interface TimelineEvent {
  date: Date;
  type: TimelineEventType;
  label: string;
  showDate?: boolean;
}

interface EffectifParcoursMissionLocaleProps {
  effectif: IEffectifMissionLocale["effectif"];
  className?: string;
}

const buildTimelineMissionLocale = (effectif: IEffectifMissionLocale["effectif"]): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  if (effectif.date_rupture) {
    const ruptureDate = effectif.date_rupture?.date || effectif.date_rupture;
    events.push({
      date: ruptureDate instanceof Date ? ruptureDate : new Date(ruptureDate),
      type: TIMELINE_EVENTS.RUPTURE,
      label: EVENT_LABELS[TIMELINE_EVENTS.RUPTURE],
    });
  }

  const organismeData = effectif.organisme_data;
  if (organismeData?.acc_conjoint === true && organismeData?.reponse_at) {
    const partageDate = organismeData.reponse_at;
    const date = partageDate instanceof Date ? partageDate : new Date(partageDate);

    events.push({
      date,
      type: TIMELINE_EVENTS.DOSSIER_PARTAGE_PAR_CFA,
      label: EVENT_LABELS[TIMELINE_EVENTS.DOSSIER_PARTAGE_PAR_CFA],
    });
  }

  if (effectif.mission_locale_logs && effectif.mission_locale_logs.length > 0) {
    effectif.mission_locale_logs.forEach((log) => {
      if (log.created_at && log.situation) {
        const date = log.created_at instanceof Date ? log.created_at : new Date(log.created_at);

        if (log.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR) {
          events.push({
            date,
            type: TIMELINE_EVENTS.CONTACTE_SANS_REPONSE,
            label: EVENT_LABELS[TIMELINE_EVENTS.CONTACTE_SANS_REPONSE],
          });
        } else {
          events.push({
            date,
            type: TIMELINE_EVENTS.TRAITE_CFA,
            label: EVENT_LABELS[TIMELINE_EVENTS.TRAITE_CFA],
          });
        }
      }
    });
  }

  if (effectif.nouveau_contrat && effectif.current_status?.date) {
    const date =
      effectif.current_status.date instanceof Date
        ? effectif.current_status.date
        : new Date(effectif.current_status.date);
    events.push({
      date,
      type: TIMELINE_EVENTS.NOUVEAU_CONTRAT,
      label: EVENT_LABELS[TIMELINE_EVENTS.NOUVEAU_CONTRAT],
    });
  }

  if (effectif.whatsapp_contact?.last_message_sent_at) {
    const sentDate = new Date(effectif.whatsapp_contact.last_message_sent_at);
    const isFailed = effectif.whatsapp_contact.message_status === "failed";
    const eventType = isFailed ? TIMELINE_EVENTS.WHATSAPP_ECHEC : TIMELINE_EVENTS.WHATSAPP_ENVOYE;
    events.push({
      date: sentDate,
      type: eventType,
      label: EVENT_LABELS[eventType],
    });

    if (effectif.whatsapp_contact.user_response_at && effectif.whatsapp_contact.user_response) {
      const responseDate = new Date(effectif.whatsapp_contact.user_response_at);
      const responseType =
        effectif.whatsapp_contact.user_response === "callback"
          ? TIMELINE_EVENTS.WHATSAPP_CALLBACK
          : TIMELINE_EVENTS.WHATSAPP_NO_HELP;
      events.push({
        date: responseDate,
        type: responseType,
        label: EVENT_LABELS[responseType],
      });
    }
  }

  if (effectif.situation?.situation) {
    const currentSituation = effectif.situation;

    const alreadyInLogs = effectif.mission_locale_logs?.some((log) => log.situation === currentSituation.situation);

    if (!alreadyInLogs) {
      // Utiliser la date actuelle car la situation n'a pas de date
      const date = new Date();

      if (currentSituation.situation === SITUATION_ENUM.NOUVEAU_PROJET) {
        events.push({
          date,
          type: TIMELINE_EVENTS.NOUVEAU_PROJET,
          label: EVENT_LABELS[TIMELINE_EVENTS.NOUVEAU_PROJET],
          showDate: false,
        });
      } else if (currentSituation.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR) {
        events.push({
          date,
          type: TIMELINE_EVENTS.CONTACTE_SANS_REPONSE,
          label: EVENT_LABELS[TIMELINE_EVENTS.CONTACTE_SANS_REPONSE],
          showDate: false,
        });
      } else {
        events.push({
          date,
          type: TIMELINE_EVENTS.TRAITE_CFA,
          label: EVENT_LABELS[TIMELINE_EVENTS.TRAITE_CFA],
          showDate: false,
        });
      }
    }
  }

  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
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
    return (
      <Image
        src="/images/parcours-dossier-traite.svg"
        alt="Le jeune a débuté un nouveau contrat"
        width={18}
        height={18}
      />
    );
  }
  if (type === TIMELINE_EVENTS.NOUVEAU_PROJET) {
    return <Image src="/images/parcours-dossier-traite.svg" alt="Nouveau projet" width={18} height={18} />;
  }
  if (type === TIMELINE_EVENTS.WHATSAPP_ENVOYE) {
    return <WhatsAppIcon color="var(--text-disabled-grey)" />;
  }
  if (type === TIMELINE_EVENTS.WHATSAPP_ECHEC) {
    return <WhatsAppIcon color="#CE0500" />;
  }
  if (type === TIMELINE_EVENTS.WHATSAPP_CALLBACK) {
    return <WhatsAppIcon color="#6A6AF4" />;
  }
  if (type === TIMELINE_EVENTS.WHATSAPP_NO_HELP) {
    return <WhatsAppIcon color="#CE0500" />;
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
                {event.showDate !== false ? `Le ${formatDate(event.date)} : ` : ""}
                <strong>{event.label}</strong>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
