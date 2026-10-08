"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { useState, type ReactNode } from "react";

import { CollabMensuelChart } from "../../charts/CollabMensuelChart";
import { DetailsDossiersTraitesPieChart } from "../../charts/DetailsDossiersTraitesPieChart";
import { isLoadingVariation } from "../../hooks/useLoadingVariation";
import { useCollaborationMensuelStats, useCollaborationSegmentStats } from "../../hooks/useStatsQueries";
import { CollabObjectifsBlock } from "../../sections/CollaborationChartBlocks";
import { CollabCfaOrigineTable } from "../../tables/CollabCfaOrigineTable";
import { NoDataMessage } from "../../ui/NoDataMessage";
import { PeriodSelector, type Period } from "../../ui/PeriodSelector";
import { StatsErrorHandler } from "../../ui/StatsErrorHandler";

import styles from "./MLCollaborationsTab.module.css";

interface MLCollaborationsTabProps {
  mlId: string;
  action?: ReactNode;
}

function Carte({ titre, children }: { titre: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.carte}>
      <h3 className={styles.titreCarte}>{titre}</h3>
      {children}
    </section>
  );
}

function Kpi({ label, tooltip, valeur }: { label: string; tooltip?: string; valeur: ReactNode }) {
  return (
    <div className={styles.kpi}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValeur}>
        {valeur}
        {tooltip && <Tooltip kind="hover" title={tooltip} />}
      </strong>
    </div>
  );
}

const formatJours = (jours: number | null) =>
  jours === null ? "—" : `${jours.toLocaleString("fr-FR")} ${jours > 1 ? "jours" : "jour"}`;

export function MLCollaborationsTab({ mlId, action }: MLCollaborationsTabProps) {
  const [period, setPeriod] = useState<Period>("30days");
  const { data, isLoading, isFetching, error } = useCollaborationSegmentStats({ period, mlId });
  const mensuel = useCollaborationMensuelStats({ period, mlId });
  const loadingVariation = isLoadingVariation(isFetching, isLoading);
  const sansCollab = !!data && data.jeunes_envoyes.current === 0 && data.objectifs.total_dossiers === 0;

  return (
    <div>
      <h2 className={styles.titre}>Suivi des collaborations avec les CFA</h2>
      <div className={styles.barreOutils}>
        <PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />
        {action}
      </div>

      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        {sansCollab ? (
          <NoDataMessage message="Aucun dossier de collaboration n'a encore été envoyé à cette Mission Locale." />
        ) : (
          <div className={styles.cartes}>
            <Carte titre="De la demande de collaboration au traitement">
              <div className={styles.kpis}>
                <Kpi label="Total dossiers de collaborations reçus" valeur={data?.jeunes_envoyes.current ?? "—"} />
                <Kpi
                  label="Total dossiers de collaboration traités"
                  valeur={data?.jeunes_contactes.current ?? "—"}
                  tooltip="Un dossier est traité dès qu'une situation est renseignée par la Mission Locale, y compris « à recontacter »."
                />
                <Kpi
                  label="Total jeunes ayant accepté l'accompagnement de la Mission Locale"
                  valeur={data?.jeunes_accompagnement_accepte.current ?? "—"}
                  tooltip="Dossiers pour lesquels un rendez-vous a été pris avec la Mission Locale."
                />
                <Kpi
                  label="Délai moyen de traitement des collaborations"
                  valeur={formatJours(data?.delai_moyen_jours ?? null)}
                  tooltip="Nombre moyen de jours entre l'envoi de la collaboration par le CFA et la première action d'un conseiller de la Mission Locale sur le dossier."
                />
              </div>
            </Carte>

            <Carte titre="Évolution mensuelle">
              <StatsErrorHandler data={mensuel.data} error={mensuel.error} isLoading={mensuel.isLoading}>
                <CollabMensuelChart data={mensuel.data?.mois} loading={mensuel.isLoading} />
              </StatsErrorHandler>
            </Carte>

            <Carte titre="De quels CFA viennent les collaborations ?">
              <CollabCfaOrigineTable mlId={mlId} />
            </Carte>

            {data && (
              <Carte titre="Résultats du traitement des dossiers issus de collaborations CFA">
                <DetailsDossiersTraitesPieChart
                  data={data.resultats}
                  loading={isLoading}
                  loadingVariation={loadingVariation}
                />
                <p className={styles.encart}>
                  <span>Part de jeunes déjà connus des Missions Locales dans les dossiers traités</span>
                  <strong>{data.part_deja_connus} %</strong>
                </p>
              </Carte>
            )}

            {data && <CollabObjectifsBlock data={data} loading={isLoading} className={styles.carte} />}
          </div>
        )}
      </StatsErrorHandler>
    </div>
  );
}
