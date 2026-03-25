"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { IEffectifMissionLocale } from "shared";

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
      {!minimal && effectif.contact_cfa && (
        <Badge as="span" severity="success">
          Utilise le Tableau de bord
        </Badge>
      )}
    </div>
  );
}

export function MlCollaborationColumn({ effectif }: MlCollaborationColumnProps) {
  const collabReceived = effectif.organisme_data?.acc_conjoint === true;
  const cfaIsRegistered = !!effectif.contact_cfa;

  if (collabReceived) {
    return (
      <div className={styles.collaborationColumn}>
        <CollaborationReceivedView effectif={effectif} />
      </div>
    );
  }

  return (
    <div className={styles.collaborationColumn}>
      <p className={styles.columnHeader}>Collaboration avec le CFA</p>

      <div className={styles.collabBlock}>
        {cfaIsRegistered ? (
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
    </div>
  );
}
