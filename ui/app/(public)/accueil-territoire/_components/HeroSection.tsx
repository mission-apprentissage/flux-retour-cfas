import Button from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";

import styles from "./hero-section.module.scss";

export function HeroSection() {
  return (
    <section className={styles.section}>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>
          Analysez les chiffres des ruptures de contrat sur votre territoire et suivez l’activité de collaboration des
          CFA et des Missions Locales
        </h1>
        <p className={styles.subtitle}>Pour collectivités et les acteurs de l’apprentissage</p>
        <div className={styles.cta}>
          <Button
            iconId="fr-icon-arrow-right-line"
            iconPosition="right"
            linkProps={{ href: "/auth/inscription/operateur_public" }}
          >
            Obtenir mon accès
          </Button>
        </div>
      </div>
      <div className={styles.heroBlock}>
        <div className={styles.figureBand} aria-hidden="true">
          <div className={styles.illustrationContainer}>
            <Image
              unoptimized
              src="/images/home/territoire/illustration-hero.png"
              alt=""
              width={580}
              height={284}
              sizes="(max-width: 768px) calc(100vw - 48px), 580px"
              priority
              className={styles.heroIllustration}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
