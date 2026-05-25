"use client";

import { StatCard } from "../cards/StatCard";
import type { ICollaborationStatsResponse } from "../hooks/useCollaborationStats";

import styles from "./CollaborationsAdminSection.module.css";
import { StatisticsSection } from "./StatisticsSection";

interface CollaborationUsageSectionProps {
  data: ICollaborationStatsResponse | undefined;
  loading: boolean;
}

export function CollaborationUsageSection({ data, loading }: CollaborationUsageSectionProps) {
  const usage = data?.national.usage;

  return (
    <StatisticsSection title="Suivi usage CFA et Missions Locales" smallTitle>
      <div className={styles.kpiCardsUsage}>
        <StatCard
          label="Total rupturants identifiés en V2"
          value={usage?.rupturants.current}
          variation={usage?.rupturants.variation}
          loading={loading}
        />
        <StatCard
          label="Dossiers envoyés par les CFA en V2"
          value={usage?.dossiers_envoyes_cfa.current}
          variation={usage?.dossiers_envoyes_cfa.variation}
          loading={loading}
        />
        <StatCard
          label="Dossiers traités par les Missions Locales en V2"
          value={usage?.dossiers_traites_ml.current}
          variation={usage?.dossiers_traites_ml.variation}
          loading={loading}
        />
        <StatCard
          label="Jeunes ayant répondu en V2"
          value={usage?.jeunes_repondus.current}
          variation={usage?.jeunes_repondus.variation}
          loading={loading}
        />
        <StatCard
          label="NB de rendez-vous pris avec les ML en V2"
          value={usage?.rdv_pris.current}
          variation={usage?.rdv_pris.variation}
          loading={loading}
        />
      </div>
    </StatisticsSection>
  );
}
