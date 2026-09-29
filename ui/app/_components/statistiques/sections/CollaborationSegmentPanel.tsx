"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { useState } from "react";

import { CollaborationCards } from "../cards/CollaborationCards";
import { DetailsDossiersTraitesPieChart } from "../charts/DetailsDossiersTraitesPieChart";
import { ObjectifsBarChart } from "../charts/ObjectifsBarChart";
import { SituationsPieChart } from "../charts/SituationsPieChart";
import { isLoadingVariation } from "../hooks/useLoadingVariation";
import { useCollaborationSegmentStats } from "../hooks/useStatsQueries";
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
}

export function CollaborationSegmentPanel({
  region,
  mlId,
  national = false,
  isPublic = false,
  isAdmin = false,
  suiviTraitement = false,
  suiviTraitementTitle = "Suivi traitement collaboration",
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
      <StatisticsSection
        title="De l'envoi par le CFA au rendez-vous en Mission Locale"
        description={<SegmentAboutText variant="collab" />}
        controls={<PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />}
        controlsPosition="below-left"
      >
        <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
          {hasNoCollab ? (
            <NoDataMessage message="Aucun dossier de collaboration n'a encore été envoyé à cette Mission Locale." />
          ) : (
            <div className={styles.cards}>
              <CollaborationCards data={data} loading={isLoading} loadingPercentage={loadingVariation} />
            </div>
          )}
        </StatsErrorHandler>
      </StatisticsSection>

      {data && !hasNoCollab && (
        <>
          <StatisticsSection title="Résultats du traitement des dossiers par les Missions Locales">
            <div className={styles.chartCard}>
              <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>
                Dossiers de collaboration traités{" "}
                <Tooltip
                  kind="hover"
                  title="Répartition des dossiers de collaboration selon la situation renseignée par la Mission Locale. Un dossier est traité dès qu'une situation est renseignée, y compris « à recontacter »."
                />
              </h3>
              <DetailsDossiersTraitesPieChart
                data={data.resultats}
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
                  <strong className={styles.encartValue}>{data.part_deja_connus} %</strong>
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
                    {data.delai_moyen_jours === null
                      ? "—"
                      : `${data.delai_moyen_jours.toLocaleString("fr-FR")} ${data.delai_moyen_jours > 1 ? "jours" : "jour"}`}
                  </strong>
                </div>
              </div>
            </div>
          </StatisticsSection>

          <StatisticsSection title="Nature des dossiers envoyés par les CFA">
            <div className={styles.chartCard}>
              <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>
                La situation du jeune lorsqu&apos;il est envoyé par le CFA{" "}
                <Tooltip
                  kind="hover"
                  title="Situation du jeune telle que qualifiée par le CFA au moment de l'envoi de la collaboration : rupture, abandon, risque de rupture selon trois niveaux, ou besoin d'aide sans rupture."
                />
              </h3>
              <SituationsPieChart data={data.situations} loading={isLoading} />
            </div>

            <div className={`${styles.chartCard} ${styles.chartCardSpaced}`}>
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
              <ObjectifsBarChart data={data.objectifs} loading={isLoading} />
            </div>
          </StatisticsSection>
        </>
      )}

      {suiviTraitement && (
        <SuiviTraitementSection
          segment="collab"
          title={suiviTraitementTitle}
          region={region}
          isAdmin={isAdmin}
          national={national}
        />
      )}
    </div>
  );
}
