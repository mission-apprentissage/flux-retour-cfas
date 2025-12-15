"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { PieChart } from "@mui/x-charts/PieChart";
import { useMemo, useState } from "react";
import { REGIONS_BY_CODE } from "shared/constants/territoires";
import { IAccompagnementConjointStats } from "shared/models/data/nationalStats.model";

import { ItemChartTooltip } from "../charts/ChartTooltip";
import { DejaConnuMiniChart } from "../charts/DejaConnuMiniChart";
import { MotifsBarChart } from "../charts/MotifsBarChart";
import { DOSSIERS_TRAITES_COLORS, DOSSIERS_TRAITES_LABELS } from "../constants";
import { useAccompagnementConjointStats } from "../hooks/useStatsQueries";
import { FranceMapSVG } from "../ui/FranceMapSVGLazy";
import { NoDataMessage } from "../ui/NoDataMessage";
import { RegionSVG } from "../ui/RegionSVG";
import { Skeleton } from "../ui/Skeleton";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./AccompagnementConjointSection.module.css";
import { StatisticsSection } from "./StatisticsSection";

const ACCORDION_TEXT = `Depuis septembre 2025, le Tableau de bord de l'apprentissage construit une expérimentation visant à concrétiser et faciliter la collaboration entre les CFA et les Missions Locales pour la mise en relation des jeunes en situation de rupture de contrat. L'objectif de cette collaboration est d'impliquer d'abord le CFA dans la qualification du besoin du jeune sur son dossier et son parcours afin de l'envoyer ensuite à la Mission Locale avec l'ensemble des éléments nécessaires pour cibler et lever les freins périphériques à l'emploi et mobiliser le réseau d'entreprises pour soutenir le jeune dans sa recherche de nouveau contrat.`;

const SECTION_TITLE =
  "Suivi traitement de l'expérimentation de collaboration de CFA partenaires avec les Missions Locales";

type StatusId = keyof typeof DOSSIERS_TRAITES_COLORS;

function MapSection({
  stats,
  loading,
  region,
}: {
  stats?: IAccompagnementConjointStats;
  loading: boolean;
  region?: string;
}) {
  const regionInfo = region ? REGIONS_BY_CODE[region as keyof typeof REGIONS_BY_CODE] : undefined;
  const locationLabel = regionInfo ? `dans la région ${regionInfo.nom}` : "en France";

  return (
    <div className={styles.mapSection}>
      <div className={styles.mapContainer}>
        {loading ? (
          <Skeleton height="232px" width="228px" />
        ) : region ? (
          <RegionSVG regionCode={region} fill="#6A6AF4" />
        ) : (
          <FranceMapSVG regionsActives={stats?.regionsActives || []} />
        )}
      </div>

      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>CFA partenaires {locationLabel}</span>
          {loading ? (
            <Skeleton height="20px" width="40px" />
          ) : (
            <span className={styles.statValue}>{stats?.cfaPartenaires || 0}</span>
          )}
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Missions Locales concernées {locationLabel}</span>
          {loading ? (
            <Skeleton height="20px" width="40px" />
          ) : (
            <span className={styles.statValue}>{stats?.mlConcernees || 0}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function FunnelCards({ stats, loading }: { stats?: IAccompagnementConjointStats; loading: boolean }) {
  return (
    <div className={styles.funnelCards}>
      <div className={styles.funnelCard}>
        <span className={styles.funnelCardLabel}>Total jeunes rupturants des CFA partenaires</span>
        {loading ? (
          <Skeleton height="48px" width="80px" />
        ) : (
          <span className={styles.funnelCardValue}>{stats?.totalJeunesRupturants?.toLocaleString("fr-FR") || 0}</span>
        )}
      </div>

      <div className={styles.funnelCard}>
        <span className={styles.funnelCardLabel}>Total dossiers partagés par les CFA aux ML</span>
        {loading ? (
          <Skeleton height="48px" width="80px" />
        ) : (
          <span className={styles.funnelCardValue}>{stats?.totalDossiersPartages?.toLocaleString("fr-FR") || 0}</span>
        )}
      </div>

      <div className={styles.funnelCard}>
        <span className={styles.funnelCardLabel}>Total dossiers traités par les ML pour les CFA partenaires</span>
        {loading ? (
          <Skeleton height="48px" width="80px" />
        ) : (
          <div className={styles.funnelCardValueWithBadge}>
            <span className={styles.funnelCardValue}>{stats?.totalDossiersTraites?.toLocaleString("fr-FR") || 0}</span>
            <span className={styles.funnelCardBadge}>{stats?.pourcentageTraites || 0}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatutsTraitementPieChart({
  stats,
  loading,
  pieData,
}: {
  stats?: IAccompagnementConjointStats;
  loading: boolean;
  pieData: Array<{ id: string; value: number; label: string; color: string }>;
}) {
  if (loading) {
    return <Skeleton height="250px" width="100%" />;
  }

  return (
    <div className={styles.pieChartContainer}>
      <div className={styles.pieChartWrapper}>
        <PieChart
          series={[{ data: pieData, highlightScope: { highlight: "item" } }]}
          height={200}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
          slots={{ legend: () => null, tooltip: ItemChartTooltip }}
          sx={{ width: "100%", maxWidth: "200px" }}
        />
      </div>

      <div className={styles.pieLegend}>
        {pieData.map((item) => (
          <div key={item.id} className={styles.pieLegendItem}>
            <div className={styles.pieLegendDot} style={{ backgroundColor: item.color }} />
            <span className={styles.pieLegendLabel}>{item.label}</span>
            <span className={styles.pieLegendValue}>{item.value.toLocaleString("fr-FR")}</span>
          </div>
        ))}
        <div className={styles.pieLegendTotal}>
          <span className={styles.pieLegendLabel}>Total dossiers traités</span>
          <span className={styles.pieLegendValue}>{stats?.totalDossiersTraites?.toLocaleString("fr-FR") || 0}</span>
        </div>
      </div>
    </div>
  );
}

function ExplanationAccordion({ isExpanded, onToggle }: { isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className={styles.expandableSection}>
      <button type="button" className={styles.expandableLink} onClick={onToggle} aria-expanded={isExpanded}>
        <span className={`fr-icon-question-line ${styles.expandableIcon}`} aria-hidden="true" />
        <span className={styles.expandableLinkText}>
          Qu&apos;est-ce que l&apos;expérimentation de collaboration entre CFA partenaires et Missions Locales ?
        </span>
        <span className={`fr-icon-arrow-${isExpanded ? "up" : "down"}-s-line`} aria-hidden="true" />
      </button>
      {isExpanded && <p className={styles.expandableText}>{ACCORDION_TEXT}</p>}
    </div>
  );
}

interface AccompagnementConjointSectionProps {
  region?: string;
  mlId?: string;
  compact?: boolean;
  noData?: boolean;
  national?: boolean;
}

export function AccompagnementConjointSection({
  region,
  mlId,
  compact,
  noData,
  national = false,
}: AccompagnementConjointSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: stats, isLoading: loading, error } = useAccompagnementConjointStats(region, mlId, national);

  const sectionTitle = compact ? "Suivi collaboration CFA" : SECTION_TITLE;

  const pieData = useMemo(() => {
    if (!stats) return [];
    return (Object.keys(DOSSIERS_TRAITES_COLORS) as StatusId[]).map((id) => ({
      id,
      value: stats.statutsTraitement[id] || 0,
      label: DOSSIERS_TRAITES_LABELS[id],
      color: DOSSIERS_TRAITES_COLORS[id],
    }));
  }, [stats]);

  if (region && stats && !stats.regionsActives.includes(region)) {
    return null;
  }

  if (mlId && stats && stats.totalDossiersPartages === 0) {
    return (
      <StatisticsSection
        title={sectionTitle}
        controls={<span className={styles.betaBadge}>BETA</span>}
        className={styles.section}
        wrapTitle
      >
        <ExplanationAccordion isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />
        <NoDataMessage />
      </StatisticsSection>
    );
  }

  if (noData) {
    return (
      <StatisticsSection
        title={sectionTitle}
        controls={<span className={styles.betaBadge}>BETA</span>}
        className={styles.section}
        wrapTitle
      >
        <ExplanationAccordion isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />
        <NoDataMessage />
      </StatisticsSection>
    );
  }

  return (
    <StatisticsSection
      title={sectionTitle}
      controls={<span className={styles.betaBadge}>BETA</span>}
      className={styles.section}
      wrapTitle
    >
      <StatsErrorHandler data={stats} error={error} isLoading={loading} emptyMessage="Aucune donnée n'est disponible">
        <ExplanationAccordion isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />

        <div className={styles.cumulativeNotice}>
          <span className="fr-icon-time-line" aria-hidden="true" />
          <span>Données cumulées depuis le début de l&apos;expérimentation (septembre 2025)</span>
        </div>

        <div className={styles.content}>
          {!compact && <MapSection stats={stats} loading={loading} region={region} />}
          <FunnelCards stats={stats} loading={loading} />

          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>
                Motif de transmission de dossiers des jeunes aux Missions Locales
              </h3>
              <MotifsBarChart data={stats?.motifs} loading={loading} />
            </div>

            <div className={styles.chartCard}>
              <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>
                Statut des dossiers traités par les ML sur les jeunes transmis par les CFA partenaires
              </h3>
              <StatutsTraitementPieChart stats={stats} loading={loading} pieData={pieData} />
              <DejaConnuMiniChart
                dejaConnu={stats?.dejaConnu || 0}
                total={stats?.totalPourDejaConnu || 0}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
