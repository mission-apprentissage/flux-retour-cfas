"use client";

import { TableSkeleton } from "@/app/_components/common/Skeleton";

import { OverviewCard } from "../cards/OverviewCard";
import { useMlTableFilters } from "../hooks/useMlTableFilters";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useCouvertureDepartementsStats, useCouvertureRegionsStats } from "../hooks/useStatsQueries";
import { useUserRegions } from "../hooks/useUserRegions";
import { NationalRegionTable } from "../tables/NationalRegionTable";
import type { Period } from "../ui/PeriodSelector";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./CouvertureTerritoiresCard.module.css";
import { ExportAllButton } from "./ExportAllButton";
import { SUIVI_TRAITEMENT_ML_ANCHOR } from "./SuiviTraitementMLCard";

export function CouvertureTerritoiresCard({ isAdmin = false }: { isAdmin?: boolean }) {
  const { period, region, scope } = useStatsFilters();

  return (
    <OverviewCard
      title={region ? "Couverture et activités en départements" : "Couverture et activités en régions"}
      actions={<ExportAllButton label="Exporter les données" priority="secondary" {...scope} />}
    >
      {region ? (
        <CouvertureDepartements period={period} region={region} />
      ) : (
        <CouvertureRegions period={period} isAdmin={isAdmin} />
      )}
    </OverviewCard>
  );
}

function CouvertureDepartements({ period, region }: { period: Period; region: string }) {
  const { data, isLoading, isFetching, error } = useCouvertureDepartementsStats(period, region);
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
          regions={data?.departements ?? []}
          loadingDeltas={isFetching && !isLoading}
          territoryLabel="Département"
          formatName={(departement) => `${departement.nom} (${departement.code})`}
          showAllLabel="Afficher tous les départements"
          showLessLabel="Afficher moins de départements"
          renderDetail={(departement) => (
            <button
              type="button"
              className={styles.detailButton}
              onClick={() => showDepartement(departement.code)}
              title={`Voir les Missions Locales de ${departement.nom}`}
            >
              <span className="fr-icon-arrow-right-line" aria-hidden="true" />
              <span className="fr-sr-only">Voir les Missions Locales de {departement.nom}</span>
            </button>
          )}
        />
      )}
    </StatsErrorHandler>
  );
}

function CouvertureRegions({ period, isAdmin }: { period: Period; isAdmin: boolean }) {
  const { data, isLoading, isFetching, error } = useCouvertureRegionsStats(period, true);
  const { regions: userRegions } = useUserRegions();
  const regions = data?.regions ?? [];

  return (
    <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : (
        <NationalRegionTable
          regions={regions}
          loadingDeltas={isFetching && !isLoading}
          detailRegions={isAdmin ? regions.map((r) => r.code) : userRegions}
        />
      )}
    </StatsErrorHandler>
  );
}
