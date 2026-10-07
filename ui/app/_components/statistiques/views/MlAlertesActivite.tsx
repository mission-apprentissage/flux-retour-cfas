import type { ReactNode } from "react";
import { ML_ALERTE_SEUILS, type IMlAlerte } from "shared/models/data/nationalStats.model";

import styles from "./MlAlertesActivite.module.css";

const formatJours = (valeur: number | null) =>
  valeur === null ? "" : ` (${valeur.toLocaleString("fr-FR")} jours en moyenne)`;

const ALERTE_LIBELLES: Record<IMlAlerte["type"], (valeur: number | null) => ReactNode> = {
  delai_collab: (valeur) => (
    <>
      Cette ML a un <strong>délai de traitement</strong> des collabs supérieur à {ML_ALERTE_SEUILS.delai_collab_jours}{" "}
      jours{formatJours(valeur)}
    </>
  ),
  a_recontacter: (valeur) => (
    <>
      Cette ML a <strong>plus de {ML_ALERTE_SEUILS.a_recontacter} jeunes à recontacter</strong>
      {valeur === null ? "" : ` (${valeur.toLocaleString("fr-FR")})`}
    </>
  ),
  collab_sans_compte: () => (
    <>
      Cette ML a <strong>reçu des demandes de collab mais n&apos;utilise pas encore le TBA</strong>
    </>
  ),
  non_engagee: () => (
    <>
      Cette ML <strong>n&apos;est pas encore une ML engagée</strong>
    </>
  ),
  inactive: () => (
    <>
      Cette ML{" "}
      <strong>n&apos;a pas utilisé le Tableau de bord depuis {ML_ALERTE_SEUILS.inactivite_jours / 7} semaines</strong>
    </>
  ),
};

export function MlAlertesActivite({ alertes }: { alertes: IMlAlerte[] }) {
  if (alertes.length === 0) return null;

  return (
    <section className={styles.bandeau} aria-labelledby="ml-alertes-titre">
      <h2 id="ml-alertes-titre" className={styles.titre}>
        <span className="fr-icon-error-warning-fill" aria-hidden="true" />
        Alertes activité
      </h2>
      <ul className={styles.liste}>
        {alertes.map((alerte) => (
          <li key={alerte.type} className={styles.alerte}>
            <span className="fr-icon-error-warning-line fr-icon--sm" aria-hidden="true" />
            <p className={styles.texte}>{ALERTE_LIBELLES[alerte.type](alerte.valeur)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
