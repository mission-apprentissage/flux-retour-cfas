import type { ITraitementDetails } from "shared/models/data/nationalStats.model";

import { TRAITEMENT_SEGMENTS_V2 } from "../constants";

import styles from "./TraitementTable.module.css";

interface TraitementDetailsBarProps {
  details: ITraitementDetails;
  total: number;
  tooltipPosition?: "top" | "bottom";
}

type SegmentKey = (typeof TRAITEMENT_SEGMENTS_V2)[number]["key"];

function regroupV1ToV2(details: ITraitementDetails): Record<SegmentKey, number> {
  return {
    rdv_pris: details.rdv_pris,
    projet_pro_securise: details.nouveau_projet,
    ne_souhaite_pas_accompagnement:
      details.ne_veut_pas_accompagnement + details.cherche_contrat + details.reorientation,
    a_recontacter: details.contacte_sans_retour,
    injoignable: details.injoignables + details.coordonnees_incorrectes,
    autre: details.autre,
  };
}

export function TraitementDetailsBar({ details, total, tooltipPosition = "top" }: TraitementDetailsBarProps) {
  if (total === 0) {
    return <span className={styles.emptyValue}>-</span>;
  }

  const groupedValues = regroupV1ToV2(details);

  const segments = TRAITEMENT_SEGMENTS_V2.map((segment) => {
    const value = groupedValues[segment.key];
    const percentage = (value / total) * 100;
    return {
      ...segment,
      value,
      percentage,
    };
  }).filter((s) => s.value > 0);

  const tooltipClassName = tooltipPosition === "bottom" ? styles.stackedBarTooltipBottom : styles.stackedBarTooltipTop;

  return (
    <div className={styles.stackedBarContainer}>
      <div className={styles.stackedBar}>
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={styles.stackedBarSegment}
            style={{
              width: `${segment.percentage}%`,
              backgroundColor: segment.color,
            }}
          />
        ))}
      </div>
      <div className={tooltipClassName}>
        <div className={styles.tooltipTitle}>Détails</div>
        {segments.map((s) => (
          <div key={s.key} className={styles.tooltipItem}>
            <span className={styles.tooltipDot} style={{ backgroundColor: s.color }} />
            <span className={styles.tooltipLabel}>{s.label}</span>
            <span className={styles.tooltipValue}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
