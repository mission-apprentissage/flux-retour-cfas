"use client";

import { Notice } from "@codegouvfr/react-dsfr/Notice";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { IEffectifMissionLocale } from "shared";

import { useAuth } from "@/app/_context/UserContext";
import { formatDate } from "@/app/_utils/date.utils";
import { getUserDisplayName, isCurrentUserId } from "@/app/_utils/user.utils";
import { DECA_TOOLTIP_TEXT } from "@/common/types/cfaRuptures";

import { CollapsibleDetail } from "../../shared/collaboration/CollapsibleDetail";
import { DossierTraiteBubble } from "../../shared/collaboration/DossierTraiteBubble";
import {
  buildLogEvents,
  formatTimelineDate,
  getEventIcon,
  TimelineEvent,
  toDate,
} from "../../shared/collaboration/timeline.utils";
import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";

import localStyles from "./CfaCollaborationDetail.module.css";

const styles = withSharedStyles(localStyles);

function buildSuiviTimeline(
  effectif: IEffectifMissionLocale["effectif"],
  ctx: { userName: string; isCurrentUser: boolean; userId?: string }
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (effectif.cfa_rupture_declaration) {
    const decl = effectif.cfa_rupture_declaration;
    const isDeclByCurrentUser = ctx.userId ? isCurrentUserId(decl.declared_by, ctx.userId) : false;
    events.push({
      date: toDate(decl.declared_at),
      title: 'Statut changé pour "En rupture"',
      subtext: isDeclByCurrentUser ? "Statut changé par vous" : `Statut changé par ${ctx.userName}`,
      icon: "rupture",
    });
  } else if (effectif.date_rupture) {
    const date = toDate(effectif.date_rupture as Date | string | { date: string | Date });

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

  if (effectif.nouveau_contrat && effectif.current_status?.date) {
    const date = toDate(effectif.current_status.date);
    events.push({
      date,
      title: "Nouveau contrat signé",
      subtext: effectif.transmitted_at
        ? `Donnée transmise par l'ERP du CFA le ${formatDate(effectif.transmitted_at)}`
        : undefined,
      icon: "nouveau-contrat",
    });
  }

  if (effectif.organisme_data?.reponse_at && effectif.organisme_data.acc_conjoint === true) {
    const date = toDate(effectif.organisme_data.reponse_at);
    const subtext = ctx.userName ? `Par ${ctx.userName}${ctx.isCurrentUser ? " (vous)" : ""}` : undefined;

    events.push({ date, title: "Dossier envoyé par le CFA", subtext, icon: "partage" });
  }

  if (effectif.organisme_data?.acc_conjoint === true && effectif.mission_locale_logs) {
    events.push(...buildLogEvents(effectif.mission_locale_logs, { traiteSuffix: " par la Mission Locale" }));
  }

  if (effectif.organisme_data?.acc_conjoint === true) {
    const hasTraite = events.some((e) => e.icon === "traite" || e.icon === "injoignable");
    if (!hasTraite) {
      events.push({ date: new Date(), title: "Attente du retour de la Mission Locale...", icon: "attente" });
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
    userId: user?._id,
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
              <div className={styles.suiviEventIcon}>{getEventIcon(event.icon, styles)}</div>
              <div className={styles.suiviEventBody}>
                <div className={styles.suiviEventHeader}>
                  <p className={styles.suiviEventTitle}>{event.title}</p>
                  {event.icon !== "attente" && (
                    <p className={styles.suiviEventDate}>{formatTimelineDate(event.date)}</p>
                  )}
                </div>
                {event.log &&
                (event.icon === "traite" || event.icon === "recontacter" || event.icon === "injoignable") ? (
                  <CollapsibleDetail subtext={event.subtext} subtextClassName={styles.suiviEventSubtext}>
                    <DossierTraiteBubble log={event.log} />
                  </CollapsibleDetail>
                ) : event.log && event.icon === "commentaire" && event.log.commentaires ? (
                  <CollapsibleDetail subtext={event.subtext} subtextClassName={styles.suiviEventSubtext}>
                    <p className={styles.suiviCommentText}>{event.log.commentaires}</p>
                  </CollapsibleDetail>
                ) : (
                  event.subtext && <p className={styles.suiviEventSubtext}>{event.subtext}</p>
                )}
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
