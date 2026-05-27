"use client";

import { StatCard } from "../cards/StatCard";
import { PrequalifResponsesDonut } from "../charts/PrequalifResponsesDonut";
import { usePrequalifStats } from "../hooks/useStatsQueries";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./PrequalifSection.module.css";
import { StatisticsSection } from "./StatisticsSection";

export function PrequalifSection() {
  const { data, isLoading, error } = usePrequalifStats("all");

  return (
    <StatisticsSection title="Préqualification WhatsApp">
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <div className={styles.layout}>
          <div className={styles.kpiColumn}>
            <StatCard label="Messages envoyés" value={data?.volume.total_sent} loading={isLoading} />
            <StatCard
              label="Taux YES"
              value={data?.responses.yes_rate}
              suffix="%"
              loading={isLoading}
              tooltip="YES / (YES + NO). Mesure la qualité du ciblage classifier."
            />
            <StatCard
              label="Taux de clic RDV"
              value={data?.rdv_tracking.click_rate}
              suffix="%"
              loading={isLoading}
              tooltip="Cliqueurs uniques / liens RDV générés. Mesure la conversion finale du pipeline."
            />
            <StatCard
              label="Opt-out STOP"
              value={data?.responses.opt_out_rate}
              suffix="%"
              loading={isLoading}
              tooltip="Effectifs ayant répondu STOP / messages envoyés. À surveiller pour la qualité de l'expérience."
            />
          </div>
          <PrequalifResponsesDonut data={data?.responses} loading={isLoading} />
        </div>

        {data?.ml_activation && (
          <div className={styles.footer}>
            <strong>
              {data.ml_activation.ml_with_rdv_url} / {data.ml_activation.ml_total}
            </strong>{" "}
            ML ont configuré leur lien de prise de rendez-vous.
          </div>
        )}
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
