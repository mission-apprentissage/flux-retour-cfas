"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { IEffectifMissionLocale } from "shared";

import { useAuth } from "@/app/_context/UserContext";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import { CfaDeclareDateRuptureModal, declareDateRuptureModal } from "../../cfa/CfaDeclareDateRuptureModal";
import { CfaRuptureInfoModal, ruptureInfoModal } from "../../cfa/CfaRuptureInfoModal";
import { useDeclareCfaRupture } from "../../cfa/hooks/useCfaMutations";
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
  const { user } = useAuth();
  const organismeId = user?.organisation?.organisme_id;
  const { mutateAsync: declareRupture } = useDeclareCfaRupture();
  const pageRef = useRef<HTMLDivElement>(null);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  useEffect(() => {
    pageRef.current?.scrollIntoView({ behavior: "instant" });
    trackPlausibleEvent("cfa_fiche_ouverte", undefined, { effectifId: String(effectif.id) });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleRupture = useCallback(() => {
    if (effectif.date_rupture) {
      ruptureInfoModal.open();
    } else {
      declareDateRuptureModal.open();
    }
  }, [effectif.date_rupture]);

  const handleDeclareRupture = useCallback(
    async (dateRupture: string) => {
      if (!organismeId) return;
      await declareRupture({
        organismeId,
        effectifId: String(effectif.id),
        dateRupture,
        source: effectif.source === "DECA" ? "effectifsDECA" : "effectifs",
      });
    },
    [organismeId, effectif.id, effectif.source, declareRupture]
  );

  const effectifName = `${effectif.prenom} ${effectif.nom}`;

  return (
    <div ref={pageRef} className={`${styles.page} ${styles.detailPage}`}>
      <div className={styles.backLink}>
        <Link
          href="/cfa"
          className="fr-link fr-link--icon-left fr-icon-arrow-left-line"
          onClick={() => trackPlausibleEvent("cfa_fiche_retour_liste")}
        >
          Retour à la liste
        </Link>
      </div>

      <div className={styles.columns}>
        <CfaEffectifInfoColumn effectif={effectif} onToggleRupture={handleToggleRupture} />
        <CfaCollaborationColumn effectif={effectif} />
        <CfaSuiviDossierColumn effectif={effectif} />
      </div>

      <CfaDeclareDateRuptureModal effectifName={effectifName} onConfirm={handleDeclareRupture} />
      <CfaRuptureInfoModal />
    </div>
  );
}
