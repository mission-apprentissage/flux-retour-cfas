"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import type { ICfaNpsStats } from "shared/models/data/nationalStats.model";

import { Skeleton } from "@/app/_components/common/Skeleton";

import { OverviewCard } from "../cards/OverviewCard";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useCfaNpsStats } from "../hooks/useStatsQueries";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./CfaSatisfactionCard.module.css";

const pluriel = (count: number, singulier: string, plurielForm: string) =>
  `${count.toLocaleString("fr-FR")} ${count > 1 ? plurielForm : singulier}`;

const NOTE_MAX = 5;

export function NpsJauge({ data, avecNombreCfa = true }: { data: ICfaNpsStats; avecNombreCfa?: boolean }) {
  const position = data.note_moyenne === null ? null : (data.note_moyenne / NOTE_MAX) * 100;
  return (
    <>
      <div className={styles.track}>
        {position !== null && (
          <span className={styles.value} style={{ left: `${position}%` }}>
            {data.note_moyenne?.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}
          </span>
        )}
      </div>
      <div className={styles.scale} aria-hidden="true">
        <span>0</span>
        <span>{NOTE_MAX}</span>
      </div>
      <p className={styles.meta}>
        Total réponses {data.total_reponses.toLocaleString("fr-FR")}
        <br />
        {pluriel(data.utilisateurs, "utilisateur unique", "utilisateurs uniques")}
        {avecNombreCfa && data.total_reponses > 0 && <>, sur {pluriel(data.cfa, "CFA", "CFA")}</>}
      </p>
    </>
  );
}

export const NPS_TITRE = "Simplicité de la demande de collaboration";

export const NPS_TOOLTIP = "Moyenne des notes (de 0 à 5) données par les CFA à la fin du formulaire de collaboration.";

export function CfaSatisfactionCard() {
  const { scope } = useStatsFilters();
  const { data, isLoading, error } = useCfaNpsStats(scope);

  return (
    <OverviewCard title="Satisfaction des CFA">
      <div className={styles.gauge}>
        <h4 className={styles.subtitle}>
          {NPS_TITRE}
          <Tooltip kind="hover" title={NPS_TOOLTIP} />
        </h4>
        <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
          {isLoading || !data ? (
            <Skeleton height="90px" width="100%" />
          ) : data.total_reponses === 0 ? (
            <p className={styles.meta}>Aucune réponse sur ce territoire pour le moment.</p>
          ) : (
            <NpsJauge data={data} />
          )}
        </StatsErrorHandler>
      </div>
    </OverviewCard>
  );
}
