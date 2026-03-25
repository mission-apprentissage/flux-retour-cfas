"use client";

import Link from "next/link";
import { IEffectifMissionLocale } from "shared";

import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";

import { MlCollaborationColumn } from "./MlCollaborationColumn";
import localStyles from "./MlCollaborationDetail.module.css";
import { MlEffectifInfoColumn } from "./MlEffectifInfoColumn";
import { MlSuiviDossierColumn } from "./MlSuiviDossierColumn";

const styles = withSharedStyles(localStyles);

interface MlCollaborationDetailProps {
  data: IEffectifMissionLocale;
}

export function MlCollaborationDetail({ data }: MlCollaborationDetailProps) {
  const { effectif } = data;

  return (
    <div className={styles.page}>
      <div className={styles.backLink}>
        <Link href="/mission-locale" className="fr-link fr-link--icon-left fr-icon-arrow-left-line">
          Retour à la liste
        </Link>
      </div>

      <div className={styles.columns}>
        <MlEffectifInfoColumn effectif={effectif} />
        <MlCollaborationColumn effectif={effectif} />
        <MlSuiviDossierColumn effectif={effectif} />
      </div>
    </div>
  );
}
