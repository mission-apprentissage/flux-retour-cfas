import type { ReactNode } from "react";

import styles from "./AlertesActivite.module.css";

export interface AlerteActivite {
  cle: string;
  contenu: ReactNode;
}

export function AlertesActivite({ alertes }: { alertes: AlerteActivite[] }) {
  if (alertes.length === 0) return null;

  return (
    <section className={styles.bandeau} aria-labelledby="alertes-activite-titre">
      <h2 id="alertes-activite-titre" className={styles.titre}>
        <span className="fr-icon-error-warning-fill" aria-hidden="true" />
        Alertes activité
      </h2>
      <ul className={styles.liste}>
        {alertes.map((alerte) => (
          <li key={alerte.cle} className={styles.alerte}>
            <span className="fr-icon-error-warning-line fr-icon--sm" aria-hidden="true" />
            <p className={styles.texte}>{alerte.contenu}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
