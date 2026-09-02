"use client";

import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { IEffectifMissionLocale } from "shared";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import { CfaRuptureInfoModal, ruptureInfoModal } from "../../cfa/CfaRuptureInfoModal";
import { getCfaListeInfo } from "../../cfa/ficheOrigine";
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
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const searchParams = useSearchParams();
  const liste = getCfaListeInfo(searchParams?.get("origine"), searchParams?.get("category"));

  // Dépend de effectif.id : la navigation Précédent/Suivant change l'[id] sans démonter le composant
  // (data servie depuis le cache react-query), il faut donc re-scroller et re-tracker à chaque dossier.
  useEffect(() => {
    pageRef.current?.scrollIntoView({ behavior: "instant" });
    trackPlausibleEvent("cfa_fiche_ouverte", undefined, { effectifId: String(effectif.id) });
  }, [effectif.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const effectifName = `${effectif.prenom} ${effectif.nom}`;

  return (
    <div ref={pageRef} className={`${styles.page} ${styles.detailPage}`}>
      <Breadcrumb
        currentPageLabel={effectifName}
        segments={[
          {
            label: liste.label,
            linkProps: {
              href: liste.href,
              onClick: () => trackPlausibleEvent("cfa_fiche_retour_liste"),
            },
          },
        ]}
        className={styles.breadcrumb}
      />

      <div className={styles.columns}>
        <CfaEffectifInfoColumn effectif={effectif} onToggleRupture={() => ruptureInfoModal.open()} />
        <CfaCollaborationColumn effectif={effectif} />
        <CfaSuiviDossierColumn effectif={effectif} />
      </div>

      <CfaRuptureInfoModal />
    </div>
  );
}
