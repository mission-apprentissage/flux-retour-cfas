"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";
import { IEffectifMissionLocale } from "shared";

import { formatDate } from "@/app/_utils/date.utils";

import { getSituationLogs } from "../../shared/collaboration/collaboration.utils";
import { CommentBubbles } from "../../shared/collaboration/CommentBubbles";
import { FeedbackBubble } from "../../shared/collaboration/FeedbackBubble";
import { MlInactiveBadge } from "../../shared/collaboration/MlInactiveBadge";
import { NouveauContratBanner } from "../../shared/collaboration/NouveauContratBanner";
import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";

import localStyles from "./CfaCollaborationDetail.module.css";
import { CollaborationSentView } from "./CollaborationSentView";
import { MlInactiveBanner } from "./MlInactiveBanner";
import { MlOrg } from "./types";

const styles = withSharedStyles(localStyles);

interface CfaCollaborationColumnProps {
  effectif: IEffectifMissionLocale["effectif"];
}

function MlCard({ ml, showInactiveMessage }: { ml: MlOrg; showInactiveMessage?: boolean }) {
  return (
    <div className={styles.mlCallOut}>
      <p className={styles.mlCallOutTitle}>Mission locale {ml.nom}</p>
      {(ml.adresse?.commune || ml.adresse?.code_postal) && (
        <p className={styles.mlCallOutLocation}>
          {[ml.adresse.commune, ml.adresse.code_postal].filter(Boolean).join(" ")}
        </p>
      )}
      {ml.activated_at ? (
        <Badge as="span" severity="success">
          Active depuis le {formatDate(ml.activated_at)}
        </Badge>
      ) : showInactiveMessage ? (
        <MlInactiveBadge />
      ) : null}
    </div>
  );
}

export function CfaCollaborationColumn({ effectif }: CfaCollaborationColumnProps) {
  const router = useRouter();
  const ml = effectif.mission_locale_organisation;
  const collabAlreadyStarted = effectif.organisme_data?.acc_conjoint === true;
  const situationLogs = collabAlreadyStarted ? getSituationLogs(effectif) : [];

  return (
    <div className={styles.collaborationColumn}>
      {!collabAlreadyStarted && <p className={styles.columnHeader}>Collaboration avec la Mission Locale</p>}

      {!effectif.date_rupture ? (
        <p className={styles.collabDisabledMessage}>
          La collaboration avec une Mission Locale n&apos;est possible que pour les jeunes en rupture de contrat.
        </p>
      ) : !collabAlreadyStarted ? (
        <>
          {ml ? (
            <>
              <div className={styles.collabBlock}>
                <p className={styles.collabQuestion}>
                  Souhaitez-vous démarrer une collaboration avec la Mission Locale ?
                </p>
                <MlCard ml={ml} showInactiveMessage />
              </div>
              <div className={styles.collabCta}>
                <Button priority="primary" onClick={() => router.push(`/cfa/${String(effectif.id)}/collaboration`)}>
                  Démarrer une collaboration
                </Button>
              </div>
            </>
          ) : (
            <p className={styles.collabDisabledMessage}>Aucune Mission Locale compétente identifiée pour ce jeune.</p>
          )}
        </>
      ) : (
        <>
          <CollaborationSentView effectif={effectif} hasMLResponse={situationLogs.length > 0} />
          {ml && !ml.activated_at && <MlInactiveBanner ml={ml} />}
          <NouveauContratBanner effectif={effectif} />
          {situationLogs.map((log) => (
            <FeedbackBubble key={String(log._id)} log={log} effectif={effectif} styles={styles} variant="received" />
          ))}
          <CommentBubbles effectif={effectif} styles={styles} variant="received" />
          {effectif.mission_locale_logs &&
            (() => {
              const lastLogWithEmail = [...(effectif.mission_locale_logs || [])]
                .reverse()
                .find((log) => log.created_by_user?.email);
              const mlUser = lastLogWithEmail?.created_by_user;
              if (!mlUser?.email) return null;
              return (
                <div style={{ display: "flex", justifyContent: "flex-end", margin: "1rem 0" }}>
                  <Button
                    priority="primary"
                    iconId="fr-icon-send-plane-fill"
                    iconPosition="right"
                    linkProps={{ href: `mailto:${mlUser.email}` }}
                  >
                    Écrire à {mlUser.prenom} {mlUser.nom} de la Mission Locale
                  </Button>
                </div>
              );
            })()}
        </>
      )}
    </div>
  );
}
