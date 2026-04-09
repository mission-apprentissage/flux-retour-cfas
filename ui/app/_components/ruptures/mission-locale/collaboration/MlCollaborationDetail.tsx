"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { IEffectifMissionLocale } from "shared";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";

import { MlCollaborationColumn } from "./MlCollaborationColumn";
import localStyles from "./MlCollaborationDetail.module.css";
import { MlEffectifInfoColumn } from "./MlEffectifInfoColumn";
import { MlSuiviDossierColumn } from "./MlSuiviDossierColumn";

const styles = withSharedStyles(localStyles);

interface MlCollaborationDetailProps {
  data: IEffectifMissionLocale;
}

function getBackLink(effectif: IEffectifMissionLocale["effectif"], nomListe: string | null): string {
  if (nomListe) {
    return `/mission-locale?statut=${nomListe}`;
  }
  if (effectif.injoignable) return "/mission-locale?statut=injoignable";
  if (effectif.a_traiter) return "/mission-locale?statut=a_traiter";
  return "/mission-locale?statut=traite";
}

export function MlCollaborationDetail({ data }: MlCollaborationDetailProps) {
  const { effectif } = data;
  const searchParams = useSearchParams();
  const nomListe = searchParams?.get("nom_liste") ?? null;
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const collabReceived = !!effectif.organisme_data?.acc_conjoint;

  useEffect(() => {
    trackPlausibleEvent("ml_fiche_ouverte", undefined, {
      effectifId: String(effectif.id),
      collaboration: collabReceived,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.page}>
      <div className={styles.backLink}>
        <Link
          href={getBackLink(effectif, nomListe)}
          className="fr-link fr-link--icon-left fr-icon-arrow-left-line"
          onClick={() => trackPlausibleEvent("ml_fiche_retour_liste")}
        >
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
