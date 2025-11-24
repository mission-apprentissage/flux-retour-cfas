"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { _get } from "@/common/httpClient";

import { calculatePercentage, getPercentageColor } from "./constants";
import { DeploymentRow } from "./DeploymentRow";
import { FranceMapSVG } from "./FranceMapSVG";
import { PeriodSelector } from "./PeriodSelector";
import { RegionTable } from "./RegionTable";
import { TableSkeleton } from "./Skeleton";
import { StatSection } from "./StatSection";
import styles from "./SyntheseView.module.css";
import { TraitementCards } from "./TraitementCards";

export function SyntheseView() {
  const [period, setPeriod] = useState<"30days" | "3months" | "all">("30days");

  const {
    data: stats,
    isLoading: loading,
    error: summaryError,
  } = useQuery(
    ["mission-locale-stats", "summary", period],
    () => _get(`/api/v1/mission-locale/stats/summary`, { params: { period } }),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 3,
      refetchOnWindowFocus: false,
    }
  );

  const {
    data: regionalData,
    isLoading: loadingRegional,
    error: regionalError,
  } = useQuery(
    ["mission-locale-stats", "regional", period],
    () => _get(`/api/v1/mission-locale/stats/regions`, { params: { period } }),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 3,
      refetchOnWindowFocus: false,
    }
  );

  const {
    data: traitementData,
    isLoading: loadingTraitement,
    error: traitementError,
  } = useQuery(
    ["mission-locale-stats", "traitement", period],
    () => _get(`/api/v1/mission-locale/stats/traitement`, { params: { period } }),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 3,
      refetchOnWindowFocus: false,
    }
  );

  const regionalStats = regionalData?.regions || [];

  if (!loading && !loadingTraitement && (!stats || !traitementData)) {
    return (
      <div>
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
      {summaryError ? (
        <Alert
          severity="error"
          title="Erreur"
          description={summaryError instanceof Error ? summaryError.message : "Une erreur est survenue"}
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

      <div className={fr.cx("fr-mb-4w")}>
        <h2 className={styles.headerTitle}>Synthèse</h2>
        <div className={styles.periodSelectorContainer}>
          <PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />
        </div>
      </div>

      <StatSection title="Traitement">
        <div className={styles.cardsContainer}>
          <TraitementCards
            latestStats={traitementData?.latest}
            firstStats={traitementData?.first}
            loading={loadingTraitement}
          />
        </div>
      </StatSection>

      <section className={`${fr.cx("fr-mb-6w")} ${styles.sectionContainer}`}>
        <h2 className={fr.cx("fr-h4", "fr-mb-3w")}>Déploiement</h2>
        <div className={styles.deploymentContentCard}>
          <div className={styles.deploymentMapContainer}>
            <FranceMapSVG />
          </div>

          <div className={styles.deploymentLegendsContainer}>
            <div className={styles.deploymentLegends}>
              <DeploymentRow
                label={
                  <>
                    Missions locales actives
                    <br /> sur le Tableau de bord
                  </>
                }
                value={stats?.activatedMlCount}
                loading={loading}
                color="#6A6AF4"
                percentage={calculatePercentage(stats?.activatedMlCount || 0, stats?.previousActivatedMlCount || 0)}
                percentageColor={getPercentageColor(stats?.activatedMlCount || 0, stats?.previousActivatedMlCount || 0)}
              />
              <DeploymentRow
                label="ML inactives"
                value={(stats?.mlCount || 0) - (stats?.activatedMlCount || 0)}
                loading={loading}
                color="#E3E3FD"
              />
              <div className={styles.deploymentSeparator} />

              <DeploymentRow label="Total ML en France" value={stats?.mlCount} loading={loading} />
            </div>
          </div>
        </div>

        <div className={styles.tableContainer}>
          {regionalError ? (
            <Alert
              severity="error"
              title="Erreur"
              description={
                regionalError instanceof Error
                  ? regionalError.message
                  : "Erreur lors du chargement des statistiques régionales"
              }
              className={fr.cx("fr-mb-4w")}
            />
          ) : loadingRegional ? (
            <TableSkeleton rows={5} />
          ) : (
            <RegionTable regions={regionalStats} />
          )}
        </div>
      </section>
    </div>
  );
}
