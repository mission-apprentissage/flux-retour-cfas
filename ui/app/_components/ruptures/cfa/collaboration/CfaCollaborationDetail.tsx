"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pageRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  return (
    <div ref={pageRef} className={`${styles.page} ${styles.detailPage}`}>
      <div className={styles.backLink}>
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/cfa/collaborations");
            }
          }}
          className="fr-link fr-link--icon-left fr-icon-arrow-left-line"
        >
          Retour à la liste
        </button>
      </div>

      <div className={styles.columns}>
        <CfaEffectifInfoColumn effectif={effectif} />
        <CfaCollaborationColumn effectif={effectif} />
        <CfaSuiviDossierColumn effectif={effectif} />
      </div>
    </div>
  );
}
