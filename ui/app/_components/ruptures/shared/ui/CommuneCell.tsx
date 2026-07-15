import { EffectifData } from "@/common/types/ruptures";

import styles from "./CommuneCell.module.css";

type CommuneCellProps = Pick<EffectifData, "commune" | "code_postal">;

export function CommuneCell({ commune, code_postal }: CommuneCellProps) {
  if (!commune && !code_postal) {
    return <span className={styles.empty}>—</span>;
  }

  return (
    <div className={styles.container}>
      {commune && <span>{commune}</span>}
      {code_postal && <span className={`fr-text--sm ${styles.postalCode}`}>{code_postal}</span>}
    </div>
  );
}
