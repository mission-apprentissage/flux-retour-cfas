"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

import { Skeleton } from "@/app/_components/common/Skeleton";

import { OverviewCard } from "../cards/OverviewCard";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useCfaNpsStats } from "../hooks/useStatsQueries";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./CfaSatisfactionCard.module.css";

const pluriel = (count: number, singulier: string, plurielForm: string) =>
  `${count.toLocaleString("fr-FR")} ${count > 1 ? plurielForm : singulier}`;

export function CfaSatisfactionCard() {
  const { scope } = useStatsFilters();
  const { data, isLoading, error } = useCfaNpsStats(scope);
  const position = data?.nps === null || data?.nps === undefined ? null : ((data.nps + 100) / 200) * 100;

  return (
    <OverviewCard title="Satisfaction des CFA">
      <div className={styles.gauge}>
        <h4 className={styles.subtitle}>
          NPS sur la collaboration
          <Tooltip
            kind="hover"
            title="Calculé à partir de la note donnée par les CFA à la fin du formulaire de collaboration (de 0 à 5) : 5 = promoteur, 4 = neutre, 0 à 3 = détracteur. Score = % de promoteurs − % de détracteurs, de −100 à 100."
          />
        </h4>
        <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
          {isLoading || !data ? (
            <Skeleton height="90px" width="100%" />
          ) : (
            <>
              <div className={styles.track}>
                {position !== null && (
                  <>
                    <span className={styles.value} style={{ left: `${position}%` }}>
                      {data.nps}
                    </span>
                    <span className={styles.marker} style={{ left: `${position}%` }} aria-hidden="true" />
                  </>
                )}
              </div>
              <div className={styles.scale} aria-hidden="true">
                <span>-100</span>
                <span>0</span>
                <span>100</span>
              </div>
              <p className={styles.meta}>
                {data.total_reponses === 0 ? (
                  "Aucune réponse sur ce territoire pour le moment."
                ) : (
                  <>
                    Total réponses {data.total_reponses.toLocaleString("fr-FR")}
                    <br />
                    {pluriel(data.utilisateurs, "utilisateur unique", "utilisateurs uniques")}, sur{" "}
                    {pluriel(data.cfa, "CFA", "CFA")}
                  </>
                )}
              </p>
            </>
          )}
        </StatsErrorHandler>
      </div>
    </OverviewCard>
  );
}
