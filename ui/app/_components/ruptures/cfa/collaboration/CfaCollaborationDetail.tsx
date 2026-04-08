"use client";

import { useEffect, useRef } from "react";
import { IEffectifMissionLocale } from "shared";

import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";

import { CfaCollaborationColumn } from "./CfaCollaborationColumn";
import localStyles from "./CfaCollaborationDetail.module.css";
import { CfaEffectifInfoColumn } from "./CfaEffectifInfoColumn";
import { CfaSuiviDossierColumn } from "./CfaSuiviDossierColumn";

const styles = withSharedStyles(localStyles);

interface CfaCollaborationDetailProps {
  data: IEffectifMissionLocale;
}

export function CfaCollaborationDetail({ data }: CfaCollaborationDetailProps) {
  const { effectif } = data;
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pageRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  return (
    <div ref={pageRef} className={`${styles.page} ${styles.detailPage}`}>
      <div className={styles.backLink}>
        <a href="/cfa" className="fr-link fr-link--icon-left fr-icon-arrow-left-line">
          Retour à la liste
        </a>
      </div>

      <div className={styles.columns}>
        <CfaEffectifInfoColumn effectif={effectif} />
        <CfaCollaborationColumn effectif={effectif} />
        <CfaSuiviDossierColumn effectif={effectif} />
      </div>
    </div>
  );
}
