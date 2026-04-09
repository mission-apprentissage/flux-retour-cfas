"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { useEffect } from "react";
import { IEffectifMissionLocale } from "shared";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import { getSituationLogs } from "../../shared/collaboration/collaboration.utils";
import { CommentBubbles } from "../../shared/collaboration/CommentBubbles";
import { FeedbackBubble } from "../../shared/collaboration/FeedbackBubble";
import { NouveauContratBanner } from "../../shared/collaboration/NouveauContratBanner";
import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";

import { CollaborationReceivedView } from "./CollaborationReceivedView";
import localStyles from "./MlCollaborationDetail.module.css";

const styles = withSharedStyles(localStyles);

interface MlCollaborationColumnProps {
  effectif: IEffectifMissionLocale["effectif"];
}

function CfaCard({ effectif, minimal }: { effectif: IEffectifMissionLocale["effectif"]; minimal?: boolean }) {
  const organismeName = effectif.organisme?.nom || effectif.organisme?.raison_sociale || "CFA non renseigné";
  const commune = effectif.organisme?.adresse?.commune;
  const codePostal = effectif.organisme?.adresse?.code_postal;

  return (
    <div className={styles.mlCallOut}>
      <p className={styles.mlCallOutTitle}>{organismeName}</p>
      {(commune || codePostal) && (
        <p className={styles.mlCallOutLocation}>{[commune, codePostal].filter(Boolean).join(" ")}</p>
      )}
      {!minimal && !!effectif.organisme?.ml_beta_activated_at && (
        <Badge as="span" severity="success">
          Utilise le Tableau de bord
        </Badge>
      )}
    </div>
  );
}

export function MlCollaborationColumn({ effectif }: MlCollaborationColumnProps) {
  const collabReceived = effectif.organisme_data?.acc_conjoint === true;
  const cfaIsTdbUser = !!effectif.organisme?.ml_beta_activated_at;
  const situationLogs = getSituationLogs(effectif);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  useEffect(() => {
    if (collabReceived) {
      trackPlausibleEvent("ml_collab_dossier_ouvert_cfa");
    } else {
      trackPlausibleEvent("ml_collab_dossier_ouvert_off");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (collabReceived) {
    return (
      <div className={styles.collaborationColumn}>
        <CollaborationReceivedView effectif={effectif} />
        <NouveauContratBanner effectif={effectif} />
        {situationLogs.map((log) => (
          <FeedbackBubble
            key={String(log._id)}
            log={log}
            effectif={effectif}
            styles={styles}
            variant="sent"
            showCurrentUser
          />
        ))}
        <CommentBubbles effectif={effectif} showCurrentUser styles={styles} variant="sent" />
      </div>
    );
  }

  return (
    <div className={styles.collaborationColumn}>
      <p className={styles.columnHeader}>Collaboration avec le CFA</p>

      <div className={styles.collabBlock}>
        {cfaIsTdbUser ? (
          <>
            <p className={styles.collabQuestion}>
              Ce dossier est envoyé de manière automatique depuis ce CFA formateur. Ce CFA utilise le Tableau de bord,
              vous pouvez les contacter directement si besoin.
            </p>
            <CfaCard effectif={effectif} />
          </>
        ) : (
          <>
            <p className={styles.collabQuestion}>
              Le CFA formateur de ce jeune n&apos;est pas encore utilisateur du Tableau de bord de l&apos;apprentissage.
            </p>
            <CfaCard effectif={effectif} minimal />
          </>
        )}
      </div>

      <NouveauContratBanner effectif={effectif} />
      {situationLogs.map((log) => (
        <FeedbackBubble
          key={String(log._id)}
          log={log}
          effectif={effectif}
          styles={styles}
          variant="sent"
          showCurrentUser
        />
      ))}
      <CommentBubbles effectif={effectif} showCurrentUser styles={styles} variant="sent" />
    </div>
  );
}
