import Image from "next/image";

import styles from "./ruptures-contrat-section.module.scss";

export function RupturesContratSection({ title, description }: { title: string; description: string }) {
  return (
    <section className={styles.section}>
      <div className={styles.imageContainer}>
        <Image
          src="/images/home/contrat-rompu-fade.png"
          alt="Illustration de deux contrats d’apprentissage déchirés"
          width={440}
          height={422}
          className={styles.image}
        />
      </div>
      <div className={styles.textContainer}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>
    </section>
  );
}
