"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useState } from "react";
import { IEffectifMissionLocale } from "shared";

import { formatDate } from "@/app/_utils/date.utils";

import styles from "./CfaCollaborationDetail.module.css";
import { useStartCollaboration } from "./hooks";

interface CfaCollaborationColumnProps {
  effectif: IEffectifMissionLocale["effectif"];
}

type MlOrg = NonNullable<IEffectifMissionLocale["effectif"]["mission_locale_organisation"]>;

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
        <p className={styles.mlCallOutInactive}>Cette Mission Locale n&apos;est pas encore active sur l&apos;outil</p>
      ) : null}
    </div>
  );
}

export function CfaCollaborationColumn({ effectif }: CfaCollaborationColumnProps) {
  const [hasStarted, setHasStarted] = useState(false);

  const ml = effectif.mission_locale_organisation;
  const collabAlreadyStarted = effectif.organisme_data?.acc_conjoint === true;
  const isCollabActive = collabAlreadyStarted || hasStarted;

  const startCollabMutation = useStartCollaboration(String(effectif.id), () => setHasStarted(true));

  return (
    <div className={styles.collaborationColumn}>
      <p className={styles.columnHeader}>Collaboration avec la Mission Locale</p>

      {!effectif.date_rupture ? (
        <p className={styles.collabDisabledMessage}>
          La collaboration avec une Mission Locale n&apos;est possible que pour les jeunes en rupture de contrat.
        </p>
      ) : !isCollabActive ? (
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
                <Button
                  priority="primary"
                  onClick={() => startCollabMutation.mutate()}
                  disabled={startCollabMutation.isLoading}
                >
                  {startCollabMutation.isLoading ? "Envoi en cours..." : "Démarrer une collaboration"}
                </Button>
              </div>
            </>
          ) : (
            <p className={styles.collabDisabledMessage}>Aucune Mission Locale compétente identifiée pour ce jeune.</p>
          )}
        </>
      ) : (
        <>
          <p className={styles.collabQuestion}>Collaboration en cours avec la Mission Locale</p>

          {ml && <MlCard ml={ml} />}

          {effectif.organisme_data && (
            <div className={styles.collabSummary}>
              <p className={styles.collabSummaryLabel}>Détails de la collaboration</p>
              {effectif.organisme_data.motif && effectif.organisme_data.motif.length > 0 && (
                <p>Motifs : {effectif.organisme_data.motif.join(", ")}</p>
              )}
              {effectif.organisme_data.commentaires && <p>{effectif.organisme_data.commentaires}</p>}
              {effectif.organisme_data.reponse_at && (
                <p className={styles.suiviEventSubtext}>Envoyé le {formatDate(effectif.organisme_data.reponse_at)}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
