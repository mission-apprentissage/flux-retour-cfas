import Image from "next/image";

import styles from "../InviterCfa.module.scss";

const ARGUMENTS = [
  "Les CFA préqualifient les dossiers : vous en recevez moins, et mieux",
  "Vous êtes informé·e de la situation administrative du jeune avant même de le contacter",
  "Allégez vous des tentatives de contact avec des jeunes qui ont déjà retrouvé des contrats, les CFA ne vous envoient que les jeunes qui ont vraiment besoin d'aide",
  "Ne cherchez plus qui contacter dans le CFA, tout est dans la fiche navette",
];

export function InviterCfaHeader() {
  return (
    <section className={styles.heroSection}>
      <div className="fr-container">
        <div className={styles.heroContentContainer}>
          <div className={styles.heroTextContainer}>
            <h1 className={styles.heroTitle}>
              Invitez les CFA à vous rejoindre sur le{" "}
              <span className={styles.accent}>Tableau de bord de l’apprentissage.</span>
            </h1>
            <ul className={styles.argList}>
              {ARGUMENTS.map((arg) => (
                <li key={arg} className={styles.argItem}>
                  <i className={`fr-icon-success-fill ${styles.argIcon}`} aria-hidden="true" />
                  <span>{arg}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.heroImageContainer}>
            <Image
              src="/images/mission-locale/header-illustration.png"
              alt=""
              className={styles.heroImage}
              width={495}
              height={470}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
