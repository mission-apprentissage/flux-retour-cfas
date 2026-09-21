"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { useState } from "react";

import { StatCard } from "../cards/StatCard";
import { DetailsDossiersTraitesPieChart } from "../charts/DetailsDossiersTraitesPieChart";
import { ObjectifsBarChart } from "../charts/ObjectifsBarChart";
import { SituationsPieChart } from "../charts/SituationsPieChart";
import { isLoadingVariation } from "../hooks/useLoadingVariation";
import { useCollaborationSegmentStats } from "../hooks/useStatsQueries";
import { CfaInvitesSansCollabTable } from "../tables/CfaInvitesSansCollabTable";
import { NoDataMessage } from "../ui/NoDataMessage";
import { PeriodSelector, type Period } from "../ui/PeriodSelector";
import { SegmentAboutText } from "../ui/SegmentAboutText";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./CollaborationSegmentPanel.module.css";
import { StatisticsSection } from "./StatisticsSection";
import { SuiviTraitementSection } from "./SuiviTraitementSection";

interface CollaborationSegmentPanelProps {
  region?: string;
  mlId?: string;
  national?: boolean;
  isPublic?: boolean;
  isAdmin?: boolean;
  suiviTraitement?: boolean;
  suiviTraitementTitle?: string;
  cfaInvites?: boolean;
}

export function CollaborationSegmentPanel({
  region,
  mlId,
  national = false,
  isPublic = false,
  isAdmin = false,
  suiviTraitement = false,
  suiviTraitementTitle = "Suivi traitement collaboration",
  cfaInvites = false,
}: CollaborationSegmentPanelProps) {
  const [period, setPeriod] = useState<Period>("30days");
  const { data, isLoading, isFetching, error } = useCollaborationSegmentStats({
    period,
    region,
    mlId,
    national,
    isPublic,
  });
  const loadingVariation = isLoadingVariation(isFetching, isLoading);
  const hasNoCollab = !!mlId && !!data && data.objectifs.total_dossiers === 0;

  return (
    <div>
      <SegmentAboutText variant="collab" />

      <StatisticsSection
        title="Suivi des collaborations CFA et Missions Locales"
        controls={<PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />}
        controlsPosition="below-left"
      >
        <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
          {hasNoCollab ? (
            <NoDataMessage message="Aucun dossier de collaboration n'a encore été envoyé à cette Mission Locale." />
          ) : (
            <>
              <div className={styles.cards}>
                <StatCard
                  label="CFA ayant collaboré"
                  value={data?.cfa_ayant_collabore.current}
                  variation={data?.cfa_ayant_collabore.variation}
                  loading={isLoading}
                  loadingPercentage={loadingVariation}
                  tooltip="CFA distincts ayant envoyé au moins un dossier de collaboration aux Missions Locales du périmètre."
                />
                <StatCard
                  label="Jeunes envoyés par les CFA"
                  value={data?.jeunes_envoyes.current}
                  variation={data?.jeunes_envoyes.variation}
                  loading={isLoading}
                  loadingPercentage={loadingVariation}
                  tooltip="Dossiers de collaboration reçus par les Missions Locales, toutes situations confondues."
                />
                <StatCard
                  label="Jeunes contactés par les Missions Locales"
                  value={data?.jeunes_contactes.current}
                  variation={data?.jeunes_contactes.variation}
                  loading={isLoading}
                  loadingPercentage={loadingVariation}
                  tooltip="Dossiers de collaboration pour lesquels la Mission Locale a renseigné une situation, y compris « à recontacter »."
                />
                <StatCard
                  label="Jeunes ayant accepté l'accompagnement"
                  value={data?.jeunes_accompagnement_accepte.current}
                  variation={data?.jeunes_accompagnement_accepte.variation}
                  loading={isLoading}
                  loadingPercentage={loadingVariation}
                  tooltip="Dossiers de collaboration pour lesquels un rendez-vous a été pris avec la Mission Locale."
                />
              </div>

              <div className={styles.chartCard}>
                <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>Dossiers de collaboration traités</h3>
                <div className={styles.resultats}>
                  <DetailsDossiersTraitesPieChart
                    data={data?.resultats}
                    loading={isLoading}
                    loadingVariation={loadingVariation}
                  />
                  <div className={styles.encarts}>
                    <div className={styles.encart}>
                      <span className={styles.encartLabel}>Part des jeunes déjà connus par la Mission Locale</span>
                      <strong className={styles.encartValue}>{data?.part_deja_connus ?? 0} %</strong>
                    </div>
                    <div className={styles.encart}>
                      <span className={styles.encartLabel}>
                        Délai moyen avant la première action de la Mission Locale
                      </span>
                      <strong className={styles.encartValue}>
                        {data?.delai_moyen_jours === null || data?.delai_moyen_jours === undefined
                          ? "—"
                          : `${data.delai_moyen_jours.toLocaleString("fr-FR")} j`}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.chartsRow}>
                <div className={styles.chartCard}>
                  <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>Situation du jeune</h3>
                  <SituationsPieChart data={data?.situations} loading={isLoading} />
                </div>

                <div className={styles.chartCard}>
                  <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>Objectifs d&apos;accompagnement</h3>
                  <ObjectifsBarChart data={data?.objectifs} loading={isLoading} />
                </div>
              </div>
            </>
          )}
        </StatsErrorHandler>
      </StatisticsSection>

      {suiviTraitement && (
        <SuiviTraitementSection
          segment="collab"
          title={suiviTraitementTitle}
          region={region}
          isAdmin={isAdmin}
          national={national}
        />
      )}

      {cfaInvites && <CfaInvitesSansCollabTable />}
    </div>
  );
}
