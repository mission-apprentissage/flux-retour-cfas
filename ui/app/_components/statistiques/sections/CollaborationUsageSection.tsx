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
          tooltip="Jeunes en rupture transmis aux Missions Locales depuis le 1er janvier 2026 par les CFA activés sur la collaboration."
        />
        <StatCard
          label="Dossiers envoyés par les CFA en V2"
          value={usage?.dossiers_envoyes_cfa.current}
          variation={usage?.dossiers_envoyes_cfa.variation}
          loading={loading}
          tooltip="Dossiers de collaboration envoyés par les CFA activés depuis le 1er janvier 2026, comptés à la date de réponse du CFA."
        />
        <StatCard
          label="Dossiers traités par les Missions Locales en V2"
          value={usage?.dossiers_traites_ml.current}
          variation={usage?.dossiers_traites_ml.variation}
          loading={loading}
          tooltip="Dossiers de collaboration pour lesquels la Mission Locale a renseigné une situation, y compris « à recontacter »."
        />
        <StatCard
          label="Jeunes ayant répondu en V2"
          value={usage?.jeunes_repondus.current}
          variation={usage?.jeunes_repondus.variation}
          loading={loading}
          tooltip="Dossiers de collaboration où le jeune a répondu à la Mission Locale : rendez-vous pris, projet professionnel sécurisé, ne souhaite pas être accompagné ou recontacté, recherche de contrat, réorientation."
        />
        <StatCard
          label="NB de rendez-vous pris avec les ML en V2"
          value={usage?.rdv_pris.current}
          variation={usage?.rdv_pris.variation}
          loading={loading}
          tooltip="Dossiers de collaboration pour lesquels un rendez-vous a été pris avec la Mission Locale."
        />
      </div>
    </StatisticsSection>
  );
}
