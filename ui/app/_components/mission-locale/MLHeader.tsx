"use client";

import styles from "./MLHeader.module.css";

export const MLHeader = () => {
  return (
    <>
      <div className={styles.mlHeaderContainer}>
        <div className={styles.mlHeaderTop}>
          <div className={styles.mlHeaderContent}>
            <h1 className="fr-h1 fr-text--blue-france fr-mb-1w">Liste des jeunes en ruptures de contrat</h1>
            <p className={`fr-text--sm fr-text--bold fr-mb-1w ${styles.mlHeaderContentSubtext}`}>
              Nous vous mettons à disposition les contacts des jeunes et leur CFA : vous êtes encouragé•e à les
              contacter. Ne partagez pas ces listes. Sources : Les ERP des CFA et{" "}
              <a
                href="https://efpconnect.emploi.gouv.fr/auth/realms/efp/protocol/cas/login?TARGET=https%3A%2F%2Fdeca.alternance.emploi.gouv.fr%3A443%2Fdeca-app%2F"
                target="_blank"
                rel="noopener external"
              >
                DECA
              </a>
            </p>
          </div>
          <div className={styles.mlHeaderActions}></div>
        </div>

        <hr className="fr-hr" />
      </div>
    </>
  );
};
