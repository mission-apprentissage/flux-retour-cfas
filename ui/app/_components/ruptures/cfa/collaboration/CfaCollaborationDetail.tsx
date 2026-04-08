"use client";

import { useRouter } from "next/navigation";
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

  return (
    <div className={styles.page}>
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
