"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";

import { _get } from "@/common/httpClient";

import { DetailsDossiersTraitesPieChart } from "../charts/DetailsDossiersTraitesPieChart";
import { RupturantsBarChart } from "../charts/RupturantsBarChart";
import { RupturantsPieChart } from "../charts/RupturantsPieChart";
import { STATS_QUERY_CONFIG } from "../config";
import { useStatsPrefetch } from "../hooks/useStatsPrefetch";
import { AccompagnementConjointSection } from "../sections/AccompagnementConjointSection";
import { IdentificationSuiviSection } from "../sections/IdentificationSuiviSection";
import { StatisticsSection } from "../sections/StatisticsSection";
import { SuiviTraitementSection } from "../sections/SuiviTraitementSection";
import { NationalRegionTable } from "../tables/NationalRegionTable";
import commonStyles from "../ui/common.module.css";
import { PeriodSelector, type Period } from "../ui/PeriodSelector";
import { TableSkeleton } from "../ui/Skeleton";

import styles from "./NationalView.module.css";

type ChartType = "bar" | "pie";

export function NationalView() {
  const [period, setPeriod] = useState<Period>("30days");
  const [chartType, setChartType] = useState<ChartType>("bar");

  useStatsPrefetch("national", period);

  const {
    data: stats,
    isLoading: loading,
    error,
  } = useQuery(
    ["mission-locale-stats", "national", period],
    () => _get(`/api/v1/admin/mission-locale/stats/national`, { params: { period } }),
    STATS_QUERY_CONFIG
  );

  if (!loading && !stats) {
    return (
      <div>
        <div className={commonStyles.headerContainer}>
          <div className={commonStyles.logoContainer}>
            <Image src="/france.png" alt="France" width={60} height={60} className={styles.franceLogo} />
          </div>
          <h2 className={commonStyles.headerTitle}>National</h2>
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

      <div className={commonStyles.headerContainer}>
        <div className={commonStyles.logoContainer}>
          <Image src="/france.png" alt="France" width={60} height={60} className={styles.franceLogo} />
        </div>
        <h2 className={commonStyles.headerTitle}>National</h2>
      </div>

      <div className={fr.cx("fr-mb-4w")}>
        <div className={commonStyles.periodSelectorContainer}>
          <PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />
        </div>
      </div>

      <IdentificationSuiviSection
        latestStats={stats?.traitement?.latest}
        firstStats={stats?.traitement?.first}
        loading={loading}
      />

      <hr />

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

      <SuiviTraitementSection period={period} />

      <AccompagnementConjointSection />
    </div>
  );
}
