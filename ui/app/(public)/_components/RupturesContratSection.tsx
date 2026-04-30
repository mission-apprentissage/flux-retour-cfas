import Image from "next/image";

import styles from "./ruptures-contrat-section.module.scss";

export function RupturesContratSection() {
  return (
    <section className={styles.section}>
      <Image
        src="/images/home/contrat-rompu.png"
        alt="Illustration de deux contrats d’apprentissage déchirés"
        width={976}
        height={852}
        className={styles.image}
      />
      <div className={styles.textContainer}>
        <h2 className={styles.title}>180 000 ruptures de contrat d’apprentissage chaque année*</h2>
        <p className={styles.description}>
          Le Tableau de bord connecte les acteurs du service public à l’emploi et de l’apprentissage pour qu’aucune
          rupture ne se solde en échec et que chacun ait une chance d’avoir un accompagnement global.
        </p>
      </div>
    </section>
  );
}
