"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";

import { _get } from "@/common/httpClient";

import { CardSection } from "./CardSection";
import { DetailsDossiersTraitesPieChart } from "./DetailsDossiersTraitesPieChart";
import { NationalRegionTable } from "./NationalRegionTable";
import styles from "./NationalView.module.css";
import { PeriodSelector } from "./PeriodSelector";
import { RupturantsBarChart } from "./RupturantsBarChart";
import { RupturantsPieChart } from "./RupturantsPieChart";
import { TableSkeleton } from "./Skeleton";
import { StatisticsSection } from "./StatisticsSection";
import syntheseStyles from "./SyntheseView.module.css";
import { TraitementCards } from "./TraitementCards";

type ChartType = "bar" | "pie";

const FIVE_MINUTES = 5 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

const STATS_QUERY_CONFIG = {
  staleTime: FIVE_MINUTES,
  cacheTime: TEN_MINUTES,
  retry: 3,
  refetchOnWindowFocus: false,
};

export function NationalView() {
  const [period, setPeriod] = useState<"30days" | "3months" | "all">("30days");
  const [chartType, setChartType] = useState<ChartType>("bar");

  const {
    data: stats,
    isLoading: loading,
    error,
  } = useQuery(
    ["mission-locale-stats", "national", period],
    () => _get(`/api/v1/mission-locale/stats/national`, { params: { period } }),
    STATS_QUERY_CONFIG
  );

  const {
    data: traitementData,
    isLoading: loadingTraitement,
    error: traitementError,
  } = useQuery(
    ["mission-locale-stats", "traitement", period],
    () => _get(`/api/v1/mission-locale/stats/traitement`, { params: { period } }),
    STATS_QUERY_CONFIG
  );

  if (!loading && !loadingTraitement && (!stats || !traitementData)) {
    return (
      <div>
        <div className={styles.headerContainer}>
          <div className={styles.logoContainer}>
            <Image src="/france.png" alt="France" width={60} height={60} className={styles.franceLogo} />
          </div>
          <h2 className={styles.headerTitle}>France entière</h2>
        </div>

        <Alert
          severity="warning"
          title="Aucune donnée disponible"
          description="Aucune donnée n'est disponible pour cette période"
          className={fr.cx("fr-mb-4w")}
        />
      </div>
    );
  }

  return (
    <div>
      {error ? (
        <Alert
          severity="error"
          title="Erreur"
          description={error instanceof Error ? error.message : "Une erreur est survenue"}
          className={fr.cx("fr-mb-4w")}
        />
      ) : null}
      {traitementError ? (
        <Alert
          severity="error"
          title="Erreur"
          description={traitementError instanceof Error ? traitementError.message : "Une erreur est survenue"}
          className={fr.cx("fr-mb-4w")}
        />
      ) : null}

      <div className={styles.headerContainer}>
        <div className={styles.logoContainer}>
          <Image src="/france.png" alt="France" width={60} height={60} className={styles.franceLogo} />
        </div>
        <h2 className={styles.headerTitle}>France entière</h2>
      </div>

      <div className={fr.cx("fr-mb-4w")}>
        <div className={styles.periodSelectorContainer}>
          <PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />
        </div>
      </div>

      <CardSection title="De l'identification au suivi">
        <div className={syntheseStyles.cardsContainer}>
          <TraitementCards
            latestStats={traitementData?.latest}
            firstStats={traitementData?.first}
            loading={loadingTraitement}
          />
        </div>
      </CardSection>

      <div className={styles.chartsRow}>
        <StatisticsSection
          title="Jeunes rupturants"
          width="one-third"
          smallTitle
          controls={
            <SegmentedControl
              hideLegend
              segments={[
                {
                  label: (
                    <span
                      className="fr-icon-line-chart-line"
                      aria-label="Diagramme en barres"
                      title="Diagramme en barres"
                    />
                  ),
                  nativeInputProps: {
                    checked: chartType === "bar",
                    onChange: () => setChartType("bar"),
                  },
                },
                {
                  label: (
                    <span
                      className="fr-icon-pie-chart-2-line fr-icon--md"
                      aria-label="Diagramme circulaire"
                      title="Diagramme circulaire"
                    />
                  ),
                  nativeInputProps: {
                    checked: chartType === "pie",
                    onChange: () => setChartType("pie"),
                  },
                },
              ]}
              small
            />
          }
        >
          <div className={styles.rupturantsContainer}>
            {chartType === "bar" ? (
              <RupturantsBarChart data={stats?.rupturantsTimeSeries || []} loading={loading} />
            ) : (
              <RupturantsPieChart data={stats?.rupturantsSummary} loading={loading} />
            )}
          </div>
        </StatisticsSection>

        <StatisticsSection title="Dossiers traités" width="two-thirds" smallTitle>
          <DetailsDossiersTraitesPieChart data={stats?.detailsTraites} loading={loading} />
        </StatisticsSection>
      </div>

      <StatisticsSection title="Couverture et activités en région">
        <div className={styles.tableContainer}>
          {loading ? <TableSkeleton rows={6} /> : <NationalRegionTable regions={stats?.regional?.regions || []} />}
        </div>
      </StatisticsSection>
    </div>
  );
}
