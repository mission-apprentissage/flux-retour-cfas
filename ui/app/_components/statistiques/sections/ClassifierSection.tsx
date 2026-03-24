"use client";

import { StatCard } from "../cards/StatCard";
import { ClassifierFeedbackCharts } from "../charts/ClassifierFeedbackCharts";
import { ClassifierSituationsPieChart } from "../charts/ClassifierSituationsPieChart";
import { useClassifierStats } from "../hooks/useStatsQueries";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import { StatisticsSection } from "./StatisticsSection";
import styles from "./WhatsAppSection.module.css";

export function ClassifierSection() {
  const { data, isLoading, error } = useClassifierStats("all");

  return (
    <StatisticsSection title="Classifier — Contact opportun">
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <div className={styles.kpiCards}>
          <StatCard label="Effectifs scorés" value={data?.scoring.total_scored} loading={isLoading} />
          <StatCard label="Contact opportun" value={data?.scoring.total_contact_opportun} loading={isLoading} />
          <StatCard
            label="Score moyen"
            value={data?.scoring.score_moyen}
            loading={isLoading}
            tooltip="Score moyen de probabilité de réponse (0-1)"
          />
          <StatCard
            label="Feedbacks reçus"
            value={data?.feedback.total}
            loading={isLoading}
            tooltip="Nombre de retours conseillers ML via la modale"
          />
        </div>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "16px" }}>Retours des conseillers</h3>
        <ClassifierFeedbackCharts data={data?.feedback} loading={isLoading} />

        <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "32px 0 16px" }}>Issues de contact</h3>
        <ClassifierSituationsPieChart data={data?.situations} loading={isLoading} />
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
