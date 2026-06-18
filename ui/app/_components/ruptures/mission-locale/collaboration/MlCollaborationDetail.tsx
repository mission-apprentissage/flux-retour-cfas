"use client";

import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { API_EFFECTIF_LISTE, IEffectifMissionLocale } from "shared";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";
import { PageHeader } from "../../shared/ui/PageHeader";

import { MlCollaborationColumn } from "./MlCollaborationColumn";
import localStyles from "./MlCollaborationDetail.module.css";
import { MlEffectifInfoColumn } from "./MlEffectifInfoColumn";
import { MlSuiviDossierColumn } from "./MlSuiviDossierColumn";

const styles = withSharedStyles(localStyles);

function getMlListInfo(
  effectif: IEffectifMissionLocale["effectif"],
  nomListe: API_EFFECTIF_LISTE | null
): { label: string; href: string } {
  const statut: API_EFFECTIF_LISTE =
    nomListe ??
    (effectif.injoignable
      ? API_EFFECTIF_LISTE.INJOIGNABLE
      : effectif.a_traiter
        ? API_EFFECTIF_LISTE.A_TRAITER
        : API_EFFECTIF_LISTE.TRAITE);

  const href = `/mission-locale?statut=${statut}`;

  switch (statut) {
    case API_EFFECTIF_LISTE.INJOIGNABLE:
    case API_EFFECTIF_LISTE.INJOIGNABLE_PRIORITAIRE:
      return { label: "Dossiers à recontacter", href };
    case API_EFFECTIF_LISTE.TRAITE:
    case API_EFFECTIF_LISTE.TRAITE_PRIORITAIRE:
      return { label: "Dossiers déjà traités", href };
    default:
      return { label: "Dossiers à traiter", href };
  }
}

interface MlCollaborationDetailProps {
  data: IEffectifMissionLocale;
}

export function MlCollaborationDetail({ data }: MlCollaborationDetailProps) {
  const { effectif, previous, next, total, currentIndex } = data;
  const searchParams = useSearchParams();
  const nomListe = (searchParams?.get("nom_liste") as API_EFFECTIF_LISTE) ?? null;
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const collabReceived = !!effectif.organisme_data?.acc_conjoint;
  const pageRef = useRef<HTMLDivElement>(null);

  const { label: listLabel, href: listHref } = getMlListInfo(effectif, nomListe);

  useEffect(() => {
    pageRef.current?.scrollIntoView({ behavior: "instant" });
    trackPlausibleEvent("ml_fiche_ouverte", undefined, {
      effectifId: String(effectif.id),
      collaboration: collabReceived,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={pageRef} className={`${styles.page} ${styles.detailPage}`}>
      <Breadcrumb
        currentPageLabel={`${effectif.prenom} ${effectif.nom}`}
        segments={[
          {
            label: listLabel,
            linkProps: {
              href: listHref,
              onClick: () => trackPlausibleEvent("ml_fiche_retour_liste"),
            },
          },
        ]}
        className={localStyles.breadcrumb}
      />

      <div className={styles.detailNav}>
        <PageHeader
          previous={previous || undefined}
          next={next || undefined}
          total={total}
          currentIndex={currentIndex}
        />
      </div>

      <div className={styles.columns}>
        <MlEffectifInfoColumn effectif={effectif} />
        <MlCollaborationColumn effectif={effectif} />
        <MlSuiviDossierColumn effectif={effectif} />
      </div>
    </div>
  );
}
