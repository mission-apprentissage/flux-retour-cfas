import Button from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";

import styles from "./hero-section.module.scss";

function AccesLandingCard({
  imgSrc,
  imgAlt,
  title,
  description,
  href,
}: {
  imgSrc: string;
  imgAlt: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className={styles.accesLandingCardContainer}>
      <Image src={imgSrc} alt={imgAlt} width={768} height={516} className={styles.accesLandingCardImg} />
      <div className={styles.accesLandingCardTextContainer}>
        <h3 className={styles.accesLandingCardTitle}>{title}</h3>
        <p className={styles.accesLandingCardDescription}>{description}</p>
        <Button
          className={styles.accesLandingCardButton}
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
          linkProps={{ href: href, "aria-label": `En savoir plus : ${title}` }}
        >
          En savoir plus
        </Button>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>Repérer et accompagner les jeunes en rupture de contrat d’apprentissage</h1>
        <p className={styles.subtitle}>
          L’outil qui détecte les ruptures de contrat et réunit les acteurs de l’apprentissage autour d’une table pour
          une démarche d’aller-vers collaborative.
        </p>
      </div>
      <div className={styles.heroBlock}>
        <Image
          src="/images/home/illustration-hero.png"
          alt="Illustration de jeunes en apprentissage"
          width={1264}
          height={404}
          priority
          className={styles.heroImage}
        />
        <div className={styles.cardsContainer}>
          <AccesLandingCard
            imgSrc="/images/home/minia-ml.png"
            imgAlt="Illustration d'une Mission Locale"
            title="Pour les Missions Locales et le service public à l’emploi"
            description="Accédez à la liste des jeunes en rupture sur votre territoire et centralisez vos collaborations avec les CFA sur un outil unique"
            href="/accueil-mission-locale"
          />
          <AccesLandingCard
            imgSrc="/images/home/minia-CFA.png"
            imgAlt="Illustration d'un CFA"
            title="Pour les établissement de formation (CFA)"
            description="Passez le relai aux Missions Locales pour les problématiques extra professionnelles sur des ruptures complexes."
            href="/accueil-cfa"
          />
          <AccesLandingCard
            imgSrc="/images/home/minia-territoire.png"
            imgAlt="Illustration d'un territoire"
            title="Pour les collectivités et acteurs du territoire"
            description="Suivez l’activité et la collaboration des CFA et des Missions Locales et consultez les chiffres des ruptures sur votre territoire"
            href="/accueil-territoire"
          />
        </div>
      </div>
    </section>
  );
}
