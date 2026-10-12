"use client";

import { useState, type ReactNode } from "react";

import { CollabMensuelChart } from "../../charts/CollabMensuelChart";
import { DetailsDossiersTraitesPieChart } from "../../charts/DetailsDossiersTraitesPieChart";
import { isLoadingVariation } from "../../hooks/useLoadingVariation";
import { useCollaborationMensuelStats, useCollaborationSegmentStats } from "../../hooks/useStatsQueries";
import { CollabObjectifsBlock } from "../../sections/CollaborationChartBlocks";
import { CollaborationsListCard } from "../../sections/CollaborationsListCard";
import { CollabCfaOrigineTable } from "../../tables/CollabCfaOrigineTable";
import { NoDataMessage } from "../../ui/NoDataMessage";
import { PeriodSelector, type Period } from "../../ui/PeriodSelector";
import { StatsErrorHandler } from "../../ui/StatsErrorHandler";

import { BasculeCollaborations, Carte, formatJours, Kpi, useVueCollaborations } from "./FicheCollaborations";
import styles from "./FicheCollaborations.module.css";

interface MLCollaborationsTabProps {
  mlId: string;
  listeAutorisee: boolean;
  action?: ReactNode;
}

export function MLCollaborationsTab({ mlId, listeAutorisee, action }: MLCollaborationsTabProps) {
  const [vue, setVue] = useVueCollaborations(listeAutorisee);

  return (
    <div>
      <h2 className={styles.titre}>Suivi des collaborations avec les CFA</h2>
      {listeAutorisee && <BasculeCollaborations vue={vue} onChange={setVue} />}
      {vue === "liste" ? <CollaborationsListCard mlId={mlId} /> : <VueChiffree mlId={mlId} action={action} />}
    </div>
  );
}

function VueChiffree({ mlId, action }: Pick<MLCollaborationsTabProps, "mlId" | "action">) {
  const [period, setPeriod] = useState<Period>("30days");
  const { data, isLoading, isFetching, error } = useCollaborationSegmentStats({ period, mlId });
  const mensuel = useCollaborationMensuelStats({ period, mlId });
  const loadingVariation = isLoadingVariation(isFetching, isLoading);
  const sansCollab = !!data && data.jeunes_envoyes.current === 0 && data.objectifs.total_dossiers === 0;

  return (
    <div>
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
