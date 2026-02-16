"use client";

import { StatCard } from "../cards/StatCard";
import { WhatsAppOutcomesPieChart } from "../charts/WhatsAppOutcomesPieChart";
import { WhatsAppResponsePieChart } from "../charts/WhatsAppResponsePieChart";
import { useWhatsAppStats } from "../hooks/useStatsQueries";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import { StatisticsSection } from "./StatisticsSection";
import styles from "./WhatsAppSection.module.css";

export function WhatsAppSection() {
  const { data, isLoading, error } = useWhatsAppStats("all");

  return (
    <StatisticsSection title="Messagerie WhatsApp">
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <div className={styles.kpiCards}>
          <StatCard label="Messages envoyés" value={data?.summary.totalSent} loading={isLoading} />
          <StatCard
            label="Taux de réponse"
            value={data?.summary.responseRate}
            suffix="%"
            loading={isLoading}
            tooltip="Pourcentage de jeunes ayant répondu au message WhatsApp (demande de rappel ou ne souhaite pas d'aide)"
          />
          <StatCard label="Demandes de rappel" value={data?.summary.callbackRequests} loading={isLoading} />
          <StatCard label="Désinscriptions (STOP)" value={data?.summary.optOuts} loading={isLoading} />
        </div>

        <div className={styles.charts}>
          <WhatsAppResponsePieChart data={data?.responseDistribution} loading={isLoading} />
          <WhatsAppOutcomesPieChart data={data?.callbackOutcomes} loading={isLoading} />
        </div>
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
