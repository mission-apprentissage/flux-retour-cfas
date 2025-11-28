"use client";

import { REGIONS_BY_CODE } from "shared/constants/territoires";

import { useTraitementStats } from "../hooks/useStatsQueries";
import { AccompagnementConjointSection } from "../sections/AccompagnementConjointSection";
import { IdentificationSuiviSection } from "../sections/IdentificationSuiviSection";
import { SuiviTraitementSection } from "../sections/SuiviTraitementSection";
import commonStyles from "../ui/common.module.css";
import { RegionSVG } from "../ui/RegionSVG";

import styles from "./RegionView.module.css";

interface RegionViewProps {
  regionCode: string;
}

export function RegionView({ regionCode }: RegionViewProps) {
  const region = REGIONS_BY_CODE[regionCode as keyof typeof REGIONS_BY_CODE];
  const regionName = region?.nom || "Région inconnue";

  const { data: traitementStats } = useTraitementStats("30days", regionCode);
  const hasNoActiveML = traitementStats?.latest?.total === 0;

  return (
    <div>
      <div className={commonStyles.headerContainer}>
        <div className={styles.mapContainer}>
          <RegionSVG regionCode={regionCode} fill="#6A6AF4" />
        </div>
        <h2 className={commonStyles.headerTitle}>{regionName}</h2>
      </div>

      {hasNoActiveML && (
        <div className={styles.warningBanner}>
          <span className="fr-icon-info-fill" aria-hidden="true" />
          <span>Il n&apos;y a aucune Mission Locale active sur Tableau de bord dans cette région pour le moment</span>
        </div>
      )}

      <IdentificationSuiviSection region={regionCode} hideDossiersTraites={hasNoActiveML} />

      {!hasNoActiveML && (
        <>
          <SuiviTraitementSection region={regionCode} />
          <AccompagnementConjointSection region={regionCode} />
        </>
      )}
    </div>
  );
}
