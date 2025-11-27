import styles from "./IdentificationSuiviSection.module.css";
import { StatisticsSection } from "./StatisticsSection";
import { TraitementCards } from "./TraitementCards";

interface TraitementStats {
  total: number;
  total_contacte: number;
  total_repondu: number;
  total_accompagne: number;
}

interface IdentificationSuiviSectionProps {
  latestStats?: TraitementStats;
  firstStats?: TraitementStats;
  loading?: boolean;
}

export function IdentificationSuiviSection({
  latestStats,
  firstStats,
  loading = false,
}: IdentificationSuiviSectionProps) {
  return (
    <StatisticsSection title="De l'identification au suivi">
      <div className={styles.cardsContainer}>
        <TraitementCards latestStats={latestStats} firstStats={firstStats} loading={loading} />
      </div>
    </StatisticsSection>
  );
}
