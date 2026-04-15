import { withSharedStyles } from "./withSharedStyles";

const styles = withSharedStyles({});

export function MlInactiveBadge() {
  return (
    <p className={styles.mlInactiveBadge}>
      <span className="fr-icon-information-fill fr-icon--sm" aria-hidden="true" />
      Inactive sur le Tableau de bord
    </p>
  );
}
