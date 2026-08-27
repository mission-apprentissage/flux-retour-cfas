import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

import styles from "./SituationCell.module.css";

interface SituationCellProps {
  /** absent : la cellule affiche un tiret */
  label?: string | null;
  tooltip?: React.ReactNode;
  /** précision sous le libellé (ex. « depuis le 12/08/2026 ») */
  detail?: string | null;
  dimmed?: boolean;
}

export function SituationCell({ label, tooltip, detail, dimmed }: SituationCellProps) {
  if (!label) {
    return <span className={`${styles.emptyCell} ${dimmed ? styles.dimmed : ""}`}>—</span>;
  }

  return (
    <div className={styles.situationCell}>
      <span className={styles.situationLabel}>
        <span className={dimmed ? styles.dimmed : undefined}>{label}</span>
        {tooltip && (
          <span className={`${styles.situationTooltip} ${dimmed ? styles.situationTooltipDimmed : ""}`}>
            <Tooltip kind="hover" title={tooltip} />
          </span>
        )}
      </span>
      {detail && <span className={`${styles.situationDetail} ${dimmed ? styles.dimmed : ""}`}>{detail}</span>}
    </div>
  );
}
