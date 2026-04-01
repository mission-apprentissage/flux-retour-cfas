"use client";

import Image from "next/image";
import { SITUATION_ENUM } from "shared";

import { formatDate, formatRelativeDate } from "@/app/_utils/date.utils";
import { isCurrentUserId } from "@/app/_utils/user.utils";

import { MlLog } from "./collaboration.utils";

export type EventIconType =
  | "rupture"
  | "partage"
  | "traite"
  | "contacte-sans-reponse"
  | "recontacter"
  | "injoignable"
  | "attente"
  | "commentaire"
  | "nouveau-contrat";

export interface TimelineEvent {
  date: Date;
  title: string;
  subtext?: string;
  icon: EventIconType;
  log?: MlLog;
}

export function getEventIcon(icon: EventIconType, styles: Record<string, string>) {
  switch (icon) {
    case "rupture":
      return <Image src="/images/parcours-rupture.svg" alt="" width={20} height={20} />;
    case "partage":
      return <Image src="/images/parcours-partage-mission-locale.svg" alt="" width={18} height={18} />;
    case "contacte-sans-reponse":
      return <Image src="/images/parcours-contacte-sans-reponse.svg" alt="" width={18} height={17} />;
    case "recontacter":
      return <span className={`fr-icon-refresh-line fr-icon--sm ${styles.recontacterIcon}`} aria-hidden="true" />;
    case "injoignable":
      return <span className={`fr-icon-close-circle-fill fr-icon--sm ${styles.injoignableIcon}`} aria-hidden="true" />;
    case "attente":
      return <span className={`fr-icon-time-fill fr-icon--sm ${styles.attenteIcon ?? ""}`} aria-hidden="true" />;
    case "commentaire":
      return <span className="fr-icon-chat-3-line fr-icon--sm" aria-hidden="true" />;
    case "nouveau-contrat":
      return <span className={`fr-icon-file-text-line fr-icon--sm ${styles.nouveauContratIcon}`} aria-hidden="true" />;
    case "traite":
    default:
      return <Image src="/images/parcours-dossier-traite.svg" alt="" width={18} height={18} />;
  }
}

export function formatTimelineDate(date: Date): string {
  const relative = formatRelativeDate(date);
  if (relative === "aujourd'hui") return "Aujourd'hui";
  if (relative === "hier") return "Hier";
  return formatDate(date);
}

export function toDate(value: Date | string | { date: string | Date }): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  return new Date(value.date as string);
}

export function buildLogCreatorSubtext(
  log: MlLog,
  options?: { userId?: string; showCurrentUser?: boolean }
): string | undefined {
  const creatorName = [log.created_by_user?.prenom, log.created_by_user?.nom].filter(Boolean).join(" ");
  if (!creatorName) return undefined;

  const showYou = options?.showCurrentUser && options.userId && isCurrentUserId(log.created_by, options.userId);
  return `Par ${creatorName}${showYou ? " (vous)" : ""}`;
}

export function buildLogEvents(
  logs: MlLog[],
  options?: { userId?: string; showCurrentUser?: boolean; traiteSuffix?: string }
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const log of logs) {
    if (!log.created_at) continue;

    const date = toDate(log.created_at);
    const subtext = buildLogCreatorSubtext(log, options);

    if (log.situation) {
      if (log.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR) {
        events.push({ date, title: "Jeune à recontacter", subtext, icon: "recontacter", log });
      } else if (log.situation === SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES) {
        events.push({ date, title: "Injoignable après plusieurs relances", subtext, icon: "injoignable", log });
      } else {
        const title = options?.traiteSuffix ? `Dossier traité${options.traiteSuffix}` : "Dossier traité";
        events.push({ date, title, subtext, icon: "traite", log });
      }
    } else if (log.commentaires) {
      const title = options?.traiteSuffix ? `Commentaire${options.traiteSuffix}` : "Commentaire ajouté";
      events.push({ date, title, subtext, icon: "commentaire", log });
    }
  }

  return events;
}
