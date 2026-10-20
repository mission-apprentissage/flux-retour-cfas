"use client";

import { UNKNOWN_DEPARTEMENT_CODE } from "shared/models/data/nationalStats.model";

import { TableSkeleton } from "@/app/_components/common/Skeleton";

import { OverviewCard } from "../cards/OverviewCard";
import { useMlTableFilters } from "../hooks/useMlTableFilters";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useCouvertureDepartementsStats } from "../hooks/useStatsQueries";
import { NationalRegionTable } from "../tables/NationalRegionTable";
import type { Period } from "../ui/PeriodSelector";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import { CouvertureRegionsContent } from "./CouvertureRegionsSection";
import styles from "./CouvertureTerritoiresCard.module.css";
import { ExportAllButton } from "./ExportAllButton";
import { SUIVI_TRAITEMENT_ML_ANCHOR } from "./SuiviTraitementMLCard";

export function CouvertureTerritoiresCard() {
  const { period, region, departement, scope } = useStatsFilters();

  return (
    <OverviewCard
      title={region ? "Couverture et activités en départements" : "Couverture et activités en régions"}
      actions={<ExportAllButton label="Exporter les données" priority="secondary" {...scope} />}
    >
      {region ? (
        <CouvertureDepartements period={period} region={region} departement={departement} />
      ) : (
        <CouvertureRegionsContent period={period} national />
      )}
    </OverviewCard>
  );
}

function CouvertureDepartements({
  period,
  region,
  departement,
}: {
  period: Period;
  region: string;
  departement?: string;
}) {
  const { data, isLoading, isFetching, isPlaceholderData, error } = useCouvertureDepartementsStats(period, region);
  const { setDepartements } = useMlTableFilters();

  const showDepartement = (code: string) => {
    setDepartements([code]);
    document.getElementById(SUIVI_TRAITEMENT_ML_ANCHOR)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : (
        <NationalRegionTable
          regions={(data?.departements ?? []).filter((ligne) => !departement || ligne.code === departement)}
          loadingDeltas={isFetching && !isLoading}
          territoryLabel="Département"
          formatName={(departement) =>
            departement.code === UNKNOWN_DEPARTEMENT_CODE ? departement.nom : `${departement.nom} (${departement.code})`
          }
          showAllLabel="Afficher tous les départements"
          showLessLabel="Afficher moins de départements"
          renderDetail={(departement) =>
            departement.code === UNKNOWN_DEPARTEMENT_CODE ? null : (
              <button
                type="button"
                className={styles.detailButton}
                disabled={isPlaceholderData}
                onClick={() => showDepartement(departement.code)}
                title={`Voir les Missions Locales de ${departement.nom}`}
              >
                <span className="fr-icon-arrow-right-line" aria-hidden="true" />
                <span className="fr-sr-only">Voir les Missions Locales de {departement.nom}</span>
              </button>
            )
          }
        />
      )}
    </StatsErrorHandler>
  );
}
