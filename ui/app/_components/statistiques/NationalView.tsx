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
import styles from "./NationalView.module.css";
import { PeriodSelector } from "./PeriodSelector";
import { RupturantsBarChart } from "./RupturantsBarChart";
import { RupturantsPieChart } from "./RupturantsPieChart";
import { StatCard } from "./StatCard";
import { StatisticsSection } from "./StatisticsSection";
import syntheseStyles from "./SyntheseView.module.css";

type ChartType = "bar" | "pie";

const FIVE_MINUTES = 5 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

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
    {
      staleTime: FIVE_MINUTES,
      cacheTime: TEN_MINUTES,
      retry: 3,
      refetchOnWindowFocus: false,
    }
  );

  if (!loading && !stats) {
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
          <StatCard
            label="Total jeunes identifiés en rupture"
            value={stats?.traitement.total}
            previousValue={stats?.traitement.total_previous}
            loading={loading}
          />
          <StatCard
            label="Total jeunes contactés par les Missions locales"
            value={stats?.traitement.total_contacte}
            previousValue={stats?.traitement.total_contacte_previous}
            loading={loading}
          />
          <StatCard
            label="Total jeunes ayant répondu"
            value={stats?.traitement.total_repondu}
            previousValue={stats?.traitement.total_repondu_previous}
            loading={loading}
          />
          <StatCard
            label="Total jeunes accompagnés ou en nouveau projet sécurisé"
            value={stats?.traitement.total_accompagne}
            previousValue={stats?.traitement.total_accompagne_previous}
            loading={loading}
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
    </div>
  );
}
