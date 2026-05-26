"use client";

import { StatCard } from "../cards/StatCard";
import type { ICollaborationStatsResponse } from "../hooks/useCollaborationStats";

import styles from "./CollaborationsAdminSection.module.css";
import { StatisticsSection } from "./StatisticsSection";

interface CollaborationActivationSectionProps {
  data: ICollaborationStatsResponse | undefined;
  loading: boolean;
}

export function CollaborationActivationSection({ data, loading }: CollaborationActivationSectionProps) {
  const activation = data?.national.activation;

  return (
    <StatisticsSection title="Suivi activation des CFA" smallTitle>
      <div className={styles.kpiCards}>
        <StatCard
          label="CFA compatibles V2"
          value={activation?.cfa_compatibles.current}
          variation={activation?.cfa_compatibles.variation}
          loading={loading}
        />
        <StatCard
          label="CFA activés sur la V2"
          value={activation?.cfa_actives.current}
          variation={activation?.cfa_actives.variation}
          loading={loading}
          tooltip="Nombre de CFA compatibles dont au moins un compte a activé la collaboration ML."
        />
        <StatCard
          label="CFA ayant réalisé au moins 1 collaboration"
          value={activation?.cfa_with_collab.current}
          variation={activation?.cfa_with_collab.variation}
          loading={loading}
          tooltip="Nombre de CFA compatibles ayant initié au moins une demande d'accompagnement conjoint depuis le 1er janvier 2026."
        />
      </div>
    </StatisticsSection>
  );
}
