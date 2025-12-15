"use client";

import { REGIONS_BY_CODE } from "shared/constants/territoires";

import { useDossiersTraitesStats, useTraitementStats } from "../hooks/useStatsQueries";
import { AccompagnementConjointSection } from "../sections/AccompagnementConjointSection";
import { IdentificationSuiviSection } from "../sections/IdentificationSuiviSection";
import { SuiviTraitementSection } from "../sections/SuiviTraitementSection";
import { RegionSVG } from "../ui/RegionSVG";
import { ViewHeader } from "../ui/ViewHeader";

import styles from "./RegionView.module.css";

interface RegionViewProps {
  regionCode: string;
  isAdmin?: boolean;
}

export function RegionView({ regionCode, isAdmin = true }: RegionViewProps) {
  const region = REGIONS_BY_CODE[regionCode as keyof typeof REGIONS_BY_CODE];
  const regionName = region?.nom || "Région inconnue";

  const { data: traitementStats } = useTraitementStats("30days", regionCode);
  const { data: dossiersTraitesData } = useDossiersTraitesStats("30days", regionCode);
  const hasNoActiveML = traitementStats?.latest?.total === 0;
  const hasNoDossiersTraites = dossiersTraitesData?.details?.total === 0;

  return (
    <div>
      <ViewHeader
        title={regionName}
        icon={
          <div className={styles.mapContainer}>
            <RegionSVG regionCode={regionCode} fill="#6A6AF4" />
          </div>
        }
      />

      {hasNoActiveML && (
        <div className={styles.warningBanner}>
          <span className="fr-icon-info-fill" aria-hidden="true" />
          <span>Il n&apos;y a aucune Mission Locale active sur Tableau de bord dans cette région pour le moment</span>
        </div>
      )}

      <IdentificationSuiviSection region={regionCode} />

      {!hasNoActiveML && !hasNoDossiersTraites && (
        <>
          <SuiviTraitementSection region={regionCode} isAdmin={isAdmin} />
          <AccompagnementConjointSection region={regionCode} />
        </>
      )}

      {!hasNoActiveML && hasNoDossiersTraites && <AccompagnementConjointSection region={regionCode} />}
    </div>
  );
}
