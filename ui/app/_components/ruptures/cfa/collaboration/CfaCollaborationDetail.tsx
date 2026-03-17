"use client";

import Link from "next/link";
import { IEffectifMissionLocale } from "shared";

import { CfaCollaborationColumn } from "./CfaCollaborationColumn";
import styles from "./CfaCollaborationDetail.module.css";
import { CfaEffectifInfoColumn } from "./CfaEffectifInfoColumn";
import { CfaSuiviDossierColumn } from "./CfaSuiviDossierColumn";

interface CfaCollaborationDetailProps {
  data: IEffectifMissionLocale;
}

export function CfaCollaborationDetail({ data }: CfaCollaborationDetailProps) {
  const { effectif } = data;

  return (
    <div className={styles.page}>
      <div className={styles.backLink}>
        <Link href="/cfa" className="fr-link fr-link--icon-left fr-icon-arrow-left-line">
          Retour à la liste
        </Link>
      </div>

      <div className={styles.columns}>
        <CfaEffectifInfoColumn effectif={effectif} />
        <CfaCollaborationColumn effectif={effectif} />
        <CfaSuiviDossierColumn effectif={effectif} />
      </div>
    </div>
  );
}
