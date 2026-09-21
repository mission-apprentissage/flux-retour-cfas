"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
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
        title="De l'envoi par le CFA au rendez-vous en Mission Locale"
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
                  label="Total CFA qui ont déjà collaboré au moins une fois"
                  value={data?.cfa_ayant_collabore.current}
                  variation={data?.cfa_ayant_collabore.variation}
                  loading={isLoading}
                  loadingPercentage={loadingVariation}
                  tooltip="CFA distincts ayant envoyé au moins un dossier de collaboration aux Missions Locales du périmètre."
                />
                <StatCard
                  label="Total jeunes envoyés par les CFA aux Missions Locales"
                  value={data?.jeunes_envoyes.current}
                  variation={data?.jeunes_envoyes.variation}
                  loading={isLoading}
                  loadingPercentage={loadingVariation}
                  tooltip="Dossiers de collaboration reçus par les Missions Locales, toutes situations confondues."
                />
                <StatCard
                  label="Total jeunes contactés par les Missions Locales"
                  value={data?.jeunes_contactes.current}
                  variation={data?.jeunes_contactes.variation}
                  loading={isLoading}
                  loadingPercentage={loadingVariation}
                  tooltip="Dossiers de collaboration pour lesquels la Mission Locale a renseigné une situation, y compris « à recontacter »."
                />
                <StatCard
                  label="Total jeunes ayant accepté l'accompagnement de la Mission Locale"
                  value={data?.jeunes_accompagnement_accepte.current}
                  variation={data?.jeunes_accompagnement_accepte.variation}
                  loading={isLoading}
                  loadingPercentage={loadingVariation}
                  tooltip="Dossiers de collaboration pour lesquels un rendez-vous a été pris avec la Mission Locale."
                />
              </div>

              <div className={styles.chartCard}>
                <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>
                  Résultats du traitement des dossiers par les Missions Locales{" "}
                  <Tooltip
                    kind="hover"
                    title="Répartition des dossiers de collaboration selon la situation renseignée par la Mission Locale. Un dossier est traité dès qu'une situation est renseignée, y compris « à recontacter »."
                  />
                </h3>
                <div className={styles.resultats}>
                  <DetailsDossiersTraitesPieChart
                    data={data?.resultats}
                    loading={isLoading}
                    loadingVariation={loadingVariation}
                  />
                  <div className={styles.encarts}>
                    <div className={styles.encart}>
                      <span className={styles.encartLabel}>
                        Part de jeunes déjà connus des Missions Locales dans les dossiers traités{" "}
                        <Tooltip
                          kind="hover"
                          title="Parmi les dossiers de collaboration traités, part des jeunes que la Mission Locale a déclarés déjà connus et accompagnés."
                        />
                      </span>
                      <strong className={styles.encartValue}>{data?.part_deja_connus ?? 0} %</strong>
                    </div>
                    <div className={styles.encart}>
                      <span className={styles.encartLabel}>
                        Délai moyen de traitement par les Missions Locales{" "}
                        <Tooltip
                          kind="hover"
                          title="Nombre moyen de jours entre l'envoi de la collaboration par le CFA et la première action d'un conseiller de la Mission Locale sur le dossier."
                        />
                      </span>
                      <strong className={styles.encartValue}>
                        {data?.delai_moyen_jours === null || data?.delai_moyen_jours === undefined
                          ? "—"
                          : `${data.delai_moyen_jours.toLocaleString("fr-FR")} ${data.delai_moyen_jours > 1 ? "jours" : "jour"}`}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.chartsRow}>
                <div className={styles.chartCard}>
                  <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>
                    La situation du jeune lorsqu&apos;il est envoyé par le CFA{" "}
                    <Tooltip
                      kind="hover"
                      title="Situation du jeune telle que qualifiée par le CFA au moment de l'envoi de la collaboration : rupture, abandon, risque de rupture selon trois niveaux, ou besoin d'aide sans rupture."
                    />
                  </h3>
                  <SituationsPieChart data={data?.situations} loading={isLoading} />
                </div>

                <div className={styles.chartCard}>
                  <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>
                    Les objectifs d&apos;accompagnement sélectionnés par les CFA{" "}
                    <Tooltip
                      kind="hover"
                      title="Objectifs cochés par le CFA lors de l'envoi de la collaboration, chaque barre étant rapportée au total des dossiers envoyés."
                    />
                  </h3>
                  <p className={fr.cx("fr-text--sm", "fr-mb-2w")}>
                    Les objectifs d&apos;accompagnement sont cumulatifs : pour un même dossier de jeune, le CFA peut
                    sélectionner plusieurs objectifs d&apos;accompagnement par la Mission Locale.
                  </p>
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
