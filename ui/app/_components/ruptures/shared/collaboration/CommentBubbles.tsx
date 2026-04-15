"use client";

import { IEffectifMissionLocale } from "shared";

import { useAuth } from "@/app/_context/UserContext";
import { formatDate } from "@/app/_utils/date.utils";
import { isCurrentUserId } from "@/app/_utils/user.utils";

import { getCommentOnlyLogs } from "./collaboration.utils";

type Styles = Record<string, string>;

interface CommentBubblesProps {
  effectif: IEffectifMissionLocale["effectif"];
  showCurrentUser?: boolean;
  styles: Styles;
  variant: "received" | "sent";
}

const VARIANT_CLASSES = {
  received: { bubble: "mlReceivedBubble", footer: "mlReceivedFooter", footerIcon: "mlReceivedFooterIcon" },
  sent: { bubble: "mlFeedbackBubble", footer: "mlFeedbackFooter", footerIcon: "mlFeedbackFooterIcon" },
} as const;

export function CommentBubbles({ effectif, showCurrentUser, styles, variant }: CommentBubblesProps) {
  const { user } = useAuth();
  const commentLogs = getCommentOnlyLogs(effectif);
  const cls = VARIANT_CLASSES[variant];

  if (commentLogs.length === 0) return null;

  return (
    <>
      {commentLogs.map((log) => {
        const creatorName = [log.created_by_user?.prenom, log.created_by_user?.nom].filter(Boolean).join(" ");
        const isCurrent = showCurrentUser ? isCurrentUserId(log.created_by, user?._id) : false;
        return (
          <div key={String(log._id)}>
            <div className={styles[cls.bubble]}>
              <p className={styles.feedbackCommentaire}>{log.commentaires}</p>
            </div>
            <div className={styles[cls.footer]}>
              <span className={`fr-icon-chat-3-line fr-icon--sm ${styles[cls.footerIcon]}`} aria-hidden="true" />
              <span>
                Commentaire{creatorName ? ` de ${creatorName}${isCurrent ? " (vous)" : ""}` : ""}{" "}
                <span className={styles.sentFooterDate}>le {formatDate(log.created_at)}</span>
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}
