"use client";

import { Notice } from "@codegouvfr/react-dsfr/Notice";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import Image from "next/image";
import { IEffectifMissionLocale, SITUATION_ENUM } from "shared";

import { useAuth } from "@/app/_context/UserContext";
import { formatDate, formatRelativeDate } from "@/app/_utils/date.utils";
import { getUserDisplayName, isCurrentUserId } from "@/app/_utils/user.utils";
import { DECA_TOOLTIP_TEXT } from "@/common/types/cfaRuptures";

import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";

import localStyles from "./CfaCollaborationDetail.module.css";

const styles = withSharedStyles(localStyles);

type EventIconType = "rupture" | "partage" | "traite" | "contacte-sans-reponse" | "attente";

interface TimelineEvent {
  date: Date;
  title: string;
  subtext?: string;
  icon: EventIconType;
}

function getEventIcon(icon: EventIconType) {
  switch (icon) {
    case "rupture":
      return <Image src="/images/parcours-rupture.svg" alt="" width={20} height={20} />;
    case "partage":
      return <Image src="/images/parcours-partage-mission-locale.svg" alt="" width={18} height={18} />;
    case "contacte-sans-reponse":
      return <Image src="/images/parcours-contacte-sans-reponse.svg" alt="" width={18} height={17} />;
    case "attente":
      return <span className={`fr-icon-time-fill fr-icon--sm ${styles.attenteIcon}`} aria-hidden="true" />;
    case "traite":
    default:
      return <Image src="/images/parcours-dossier-traite.svg" alt="" width={18} height={18} />;
  }
}

function formatTimelineDate(date: Date): string {
  const relative = formatRelativeDate(date);
  if (relative === "aujourd'hui") return "Aujourd'hui";
  if (relative === "hier") return "Hier";
  return formatDate(date);
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value as string);
}

interface TimelineContext {
  userName: string;
  isCurrentUser: boolean;
}

function buildSuiviTimeline(effectif: IEffectifMissionLocale["effectif"], ctx: TimelineContext): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (effectif.date_rupture) {
    const rawDate = effectif.date_rupture;
    const date = toDate(((rawDate as any).date || rawDate) as Date | string);

    events.push({
      date,
      title: "Rupture du contrat d'apprentissage",
      subtext: effectif.transmitted_at
        ? effectif.source === "DECA"
          ? `Donnée captée depuis DECA le ${formatDate(effectif.transmitted_at)}`
          : `Donnée transmise par votre ERP du CFA le ${formatDate(effectif.transmitted_at)}`
        : undefined,
      icon: "rupture",
    });
  }

  if (effectif.organisme_data?.reponse_at && effectif.organisme_data.acc_conjoint === true) {
    const date = toDate(effectif.organisme_data.reponse_at);
    const subtext = ctx.userName ? `Par ${ctx.userName}${ctx.isCurrentUser ? " (vous)" : ""}` : undefined;

    events.push({
      date,
      title: "Dossier envoyé par le CFA",
      subtext,
      icon: "partage",
    });
  }

  if (effectif.organisme_data?.acc_conjoint === true && effectif.mission_locale_logs) {
    effectif.mission_locale_logs.forEach((log) => {
      if (log.created_at && log.situation) {
        const date = toDate(log.created_at);

        if (log.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR) {
          events.push({
            date,
            title: "Contacté sans réponse par la Mission Locale",
            icon: "contacte-sans-reponse",
          });
        } else if (log.situation === SITUATION_ENUM.NOUVEAU_PROJET) {
          events.push({
            date,
            title: "Retour de la Mission Locale — Nouvelle situation",
            icon: "traite",
          });
        } else {
          events.push({
            date,
            title: "Dossier traité par la Mission Locale",
            icon: "traite",
          });
        }
      }
    });
  }

  if (effectif.organisme_data?.acc_conjoint === true) {
    const hasTraite = events.some((e) => e.icon === "traite");
    if (!hasTraite) {
      events.push({
        date: new Date(),
        title: "Attente du retour de la Mission Locale...",
        icon: "attente",
      });
    }
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

interface CfaSuiviDossierColumnProps {
  effectif: IEffectifMissionLocale["effectif"];
}

export function CfaSuiviDossierColumn({ effectif }: CfaSuiviDossierColumnProps) {
  const { user } = useAuth();
  const od = effectif.organisme_data;
  const timeline = buildSuiviTimeline(effectif, {
    userName: getUserDisplayName(user),
    isCurrentUser: isCurrentUserId(od?.acc_conjoint_by, user?._id),
  });

  return (
    <div className={styles.suiviColumn}>
      <p className={styles.columnHeader}>Suivi du dossier</p>

      <div className={styles.suiviNotice}>
        {effectif.source === "DECA" ? (
          <Notice
            title={
              <span>
                Les informations liées au dossier de {effectif.prenom || "ce jeune"} sont obtenues depuis la base de
                données <strong style={{ color: "var(--text-action-high-blue-france)" }}>DECA</strong>
                <span style={{ marginLeft: "0.25rem" }}>
                  <Tooltip kind="hover" title={DECA_TOOLTIP_TEXT} />
                </span>
                . Il se peut que la situation réelle du jeune ait évolué.
              </span>
            }
          />
        ) : (
          <Notice
            title={`Les informations liées au dossier de ${effectif.prenom || "ce jeune"} sont obtenues directement de votre ERP. Il se peut que la situation réelle du jeune ait évolué.`}
          />
        )}
      </div>

      {timeline.length > 0 ? (
        <div className={styles.suiviTimeline}>
          {timeline.map((event, index) => (
            <div
              key={`${event.title}-${index}`}
              className={`${styles.suiviEvent} ${event.icon === "attente" ? styles.suiviEventAttente : ""}`}
            >
              <div className={styles.suiviEventIcon}>{getEventIcon(event.icon)}</div>
              <div className={styles.suiviEventBody}>
                <div className={styles.suiviEventHeader}>
                  <p className={styles.suiviEventTitle}>{event.title}</p>
                  {event.icon !== "attente" && (
                    <p className={styles.suiviEventDate}>{formatTimelineDate(event.date)}</p>
                  )}
                </div>
                {event.subtext && <p className={styles.suiviEventSubtext}>{event.subtext}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.emptyTimeline}>Aucun événement à afficher.</p>
      )}
    </div>
  );
}
