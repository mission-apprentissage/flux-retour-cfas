"use client";

import { IEffectifMissionLocale, SITUATION_ENUM } from "shared";

import { useAuth } from "@/app/_context/UserContext";
import { formatDate } from "@/app/_utils/date.utils";
import { isCurrentUserId } from "@/app/_utils/user.utils";

import { BooleanLine } from "./BooleanLine";
import { isContactReussi, MlLog } from "./collaboration.utils";

type Styles = Record<string, string>;

interface FeedbackBubbleStyleKeys {
  bubble: string;
  footer: string;
  footerIcon: string;
}

const VARIANT_STYLE_KEYS: Record<"sent" | "received", FeedbackBubbleStyleKeys> = {
  sent: { bubble: "mlFeedbackBubble", footer: "mlFeedbackFooter", footerIcon: "mlFeedbackFooterIcon" },
  received: { bubble: "mlReceivedBubble", footer: "mlReceivedFooter", footerIcon: "mlReceivedFooterIcon" },
};

interface FeedbackBubbleProps {
  log: MlLog;
  effectif: IEffectifMissionLocale["effectif"];
  styles: Styles;
  variant: "sent" | "received";
  showCurrentUser?: boolean;
}

export function FeedbackBubble({ log, effectif, styles, variant, showCurrentUser }: FeedbackBubbleProps) {
  const { user } = useAuth();
  if (!log.situation) return null;

  const isNeVeutPas = log.situation === SITUATION_ENUM.NE_VEUT_PAS_ACCOMPAGNEMENT;
  const contactReussi = isContactReussi(log.situation) || isNeVeutPas;
  const rdvPris = log.situation === SITUATION_ENUM.RDV_PRIS;
  const isRecontacter = log.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR;
  const isInjoignable = log.situation === SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES;

  const creatorName = [log.created_by_user?.prenom, log.created_by_user?.nom].filter(Boolean).join(" ");
  const isCurrent = showCurrentUser ? isCurrentUserId(log.created_by, user?._id) : false;
  const mlName = effectif.mission_locale_organisation?.nom;

  const cls = VARIANT_STYLE_KEYS[variant];

  const footerIcon = isRecontacter ? (
    <span className={`fr-icon-refresh-line fr-icon--sm ${styles.recontacterIcon}`} aria-hidden="true" />
  ) : isInjoignable ? (
    <span className={`fr-icon-close-circle-fill fr-icon--sm ${styles.injoignableIcon}`} aria-hidden="true" />
  ) : (
    <span className={`fr-icon-success-fill fr-icon--sm ${styles[cls.footerIcon]}`} aria-hidden="true" />
  );

  const footerLabel = isRecontacter
    ? "Jeune à recontacter"
    : isInjoignable
      ? "Injoignable après plusieurs relances"
      : "Dossier traité";

  return (
    <>
      <div className={styles[cls.bubble]}>
        <div className={styles.sentBubbleSection}>
          <p className={styles.sentSectionTitle}>Situation</p>
          <BooleanLine label="Jeune contacté" value={contactReussi} className={styles.feedbackLine} />
          {!contactReussi && log.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR && (
            <p className={styles.feedbackLine}>
              {"🔄 "}
              <strong>À relancer bientôt</strong>
            </p>
          )}
          {!contactReussi && log.situation === SITUATION_ENUM.COORDONNEES_INCORRECT && (
            <p className={styles.feedbackLine}>
              ❌ <strong>Mauvaises coordonnées / Injoignable</strong>
            </p>
          )}
          {!contactReussi && log.situation === SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES && (
            <p className={styles.feedbackLine}>
              ❌ <strong>Injoignable après plusieurs relances</strong>
            </p>
          )}
          {contactReussi && (
            <BooleanLine label="Rendez-vous pris à la Mission Locale" value={rdvPris} className={styles.feedbackLine} />
          )}
        </div>

        {log.commentaires && (
          <div className={styles.sentBubbleSection}>
            <p className={styles.sentSectionTitle}>Commentaire de la Mission Locale</p>
            <p className={styles.feedbackCommentaire}>{log.commentaires}</p>
          </div>
        )}
      </div>

      <div className={styles[cls.footer]}>
        {footerIcon}
        <span>
          {footerLabel}
          {creatorName ? ` par ${creatorName}${isCurrent ? " (vous)" : ""}` : ""}
          {variant === "received" && mlName ? `, Mission Locale ${mlName}` : ""}{" "}
          <span className={styles.sentFooterDate}>le {formatDate(log.created_at)}</span>
        </span>
      </div>
    </>
  );
}
