"use client";

import { StatCard } from "../cards/StatCard";
import { usePrequalifStats } from "../hooks/useStatsQueries";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import { StatisticsSection } from "./StatisticsSection";
import styles from "./WhatsAppSection.module.css";

type Props = { scope: "national" } | { scope: "region"; code: string } | { scope: "ml"; mlId: string };

export function PrequalifSection(props: Props) {
  const queryScope =
    props.scope === "national"
      ? { national: true }
      : props.scope === "region"
        ? { region: props.code }
        : { mlId: props.mlId };

  const { data, isLoading, error } = usePrequalifStats("all", queryScope);

  return (
    <StatisticsSection title="Préqualification WhatsApp">
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <div className={styles.kpiCards}>
          <StatCard label="Messages envoyés" value={data?.volume.total_sent} loading={isLoading} />
          <StatCard
            label="Backfill (J1-J5)"
            value={data?.volume.sent_by_mode.backfill}
            loading={isLoading}
            tooltip="Envois effectués via la CLI manuelle pendant les 5 jours de ramp initial — pas de notif individuelle ML au YES."
          />
          <StatCard
            label="Cron quotidien"
            value={data?.volume.sent_by_mode.daily}
            loading={isLoading}
            tooltip="Envois effectués via le cron 9h en régime stable — notif individuelle ML activée au YES."
          />
          <StatCard
            label="Échecs d'envoi"
            value={data?.volume.failed_send}
            loading={isLoading}
            tooltip="Erreurs Brevo après réservation atomique (cf. plan §7.7). Retry automatique après cooldown 1h."
          />
          <StatCard label="Opt-out STOP" value={data?.volume.opted_out} loading={isLoading} />
        </div>

        <div className={styles.kpiCards}>
          <StatCard label="✅ Ça m'intéresse" value={data?.responses.yes_count} loading={isLoading} />
          <StatCard label="❌ Ne veut pas d'aide" value={data?.responses.no_count} loading={isLoading} />
          <StatCard label="Pas de réponse" value={data?.responses.no_response} loading={isLoading} />
          <StatCard
            label="Taux de réponse"
            value={data?.responses.response_rate}
            suffix="%"
            loading={isLoading}
            tooltip="(YES + NO) / total envoyés. Inclut uniquement les réponses reconnues."
          />
          <StatCard
            label="Taux YES"
            value={data?.responses.yes_rate}
            suffix="%"
            loading={isLoading}
            tooltip="YES / (YES + NO). Mesure la qualité du ciblage classifier."
          />
          <StatCard
            label="Auto-reply envoyés"
            value={data?.responses.auto_reply_sent}
            loading={isLoading}
            tooltip="Réponses non reconnues ayant déclenché le message d'aide automatique."
          />
        </div>

        <div className={styles.kpiCards}>
          <StatCard
            label="Liens RDV générés"
            value={data?.rdv_tracking.tokens_generated}
            loading={isLoading}
            tooltip="YES avec ML configurée rdv_url. Volume max possible = yes_count."
          />
          <StatCard label="Clics totaux" value={data?.rdv_tracking.total_clicks} loading={isLoading} />
          <StatCard
            label="Cliqueurs uniques"
            value={data?.rdv_tracking.unique_clickers}
            loading={isLoading}
            tooltip="Effectifs distincts ayant cliqué au moins 1 fois."
          />
          <StatCard
            label="Taux de clic"
            value={data?.rdv_tracking.click_rate}
            suffix="%"
            loading={isLoading}
            tooltip="unique_clickers / tokens_generated. Inclut les clics prefetch bots Meta/WhatsApp (cf. plan §7ter.1)."
          />
        </div>

        {data?.ml_activation && (
          <div className={styles.kpiCards}>
            <StatCard
              label="ML avec lien RDV"
              value={data.ml_activation.ml_with_rdv_url}
              loading={isLoading}
              tooltip={`Sur ${data.ml_activation.ml_total} ML au total dans le scope.`}
            />
          </div>
        )}
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
