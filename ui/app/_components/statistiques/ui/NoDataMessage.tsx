import styles from "./NoDataMessage.module.css";

export const NO_DATA_ML_MESSAGE =
  "Cette Mission Locale n'est pas encore utilisatrice du Tableau de bord de l'apprentissage";

interface NoDataMessageProps {
  message?: string;
}

export function NoDataMessage({ message = NO_DATA_ML_MESSAGE }: NoDataMessageProps) {
  return (
    <div className={styles.noDataBox}>
      <div className={styles.noDataIcon}>
        <i className="fr-icon-information-fill" aria-hidden="true" />
      </div>
      <p className={styles.noDataMessage}>{message}</p>
    </div>
  );
}
