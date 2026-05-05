"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";

import { PauseButton } from "../../_components/PauseButton";
import { useInfiniteCarousel } from "../../_hooks/useInfiniteCarousel";

import styles from "./processus-section.module.scss";

type Card = {
  image: string;
  title: string;
};

const CARDS: Array<Card> = [
  {
    image: "/images/home/cfa/avantage-cfa-rupture.png",
    title: "Détection automatique des rupturants",
  },
  {
    image: "/images/home/cfa/avantage-cfa-collab.png",
    title: "Collaboration avec la Mission Locale à votre initative sur chaque dossier",
  },
  {
    image: "/images/home/cfa/avantage-cfa-ml.png",
    title: "Détection automatique de la Mission Locale de rattachement du jeune",
  },
  {
    image: "/images/home/cfa/avantage-cfa-fiche-navette.png",
    title: "Une fiche navette par dossier pour voir toute les interactions réalisées",
  },
  {
    image: "/images/home/cfa/avantage-cfa-suivi.png",
    title: "Notification dès qu’une Mission Locale prend une action sur un dossier de jeune",
  },
];

const NOMBRE_CARDS = CARDS.length;
const TRACK_CARDS = [...CARDS, ...CARDS, ...CARDS];
const TRANSITION_DURATION = 500;

export function ProcessusSection() {
  const { position, transitionEnabled, animationActive, activeIndex, goToNext, goToPrevious, togglePause } =
    useInfiniteCarousel({ count: NOMBRE_CARDS });

  return (
    <section
      className={styles.section}
      aria-roledescription="carrousel"
      aria-label="Avantages de la collaboration sur le Tableau de bord"
    >
      <div className={styles.contentWrapper}>
        <div className={styles.intro}>
          <h2 className={styles.title}>
            Centralisez et digitalisez votre relation avec les Missions Locales pour accompagner les jeunes en rupture
            de contrat
          </h2>
          <p className={styles.subtitle}>
            Moins de courriels qui se perdent, moins de temps à chercher les contacts dans un annuaire de Missions
            Locales. Concentrez-vous sur l’accompagnement.
          </p>
        </div>
      </div>

      <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
        Avantage {activeIndex + 1} sur {NOMBRE_CARDS} — {CARDS[activeIndex].title}.
      </div>

      <div className={styles.carousel}>
        <div
          className={styles.track}
          style={
            {
              "--position": position,
              transition: transitionEnabled ? `transform ${TRANSITION_DURATION}ms ease` : "none",
            } as React.CSSProperties
          }
        >
          {TRACK_CARDS.map((card, index) => {
            const isActive = index === position;
            return (
              <article
                key={`${card.title}-${index}`}
                className={styles.card}
                aria-roledescription="diapositive"
                aria-label={`${(index % NOMBRE_CARDS) + 1} sur ${NOMBRE_CARDS}`}
                aria-hidden={!isActive}
              >
                <div className={styles.cardImageWrapper}>
                  <Image src={card.image} alt="" width={120} height={80} className={styles.cardImage} />
                </div>
                <p className={styles.cardTitle}>{card.title}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.progress} aria-hidden="true">
          {CARDS.map((card, index) => (
            <div key={card.title} className={index === activeIndex ? styles.progressStepActive : styles.progressStep} />
          ))}
        </div>

        <div className={styles.controls}>
          <button type="button" onClick={goToPrevious} className={styles.iconButton} aria-label="Avantage précédent">
            <span className="fr-icon-arrow-left-s-line" aria-hidden="true" />
          </button>
          <div className={styles.controlsRight}>
            <PauseButton isPaused={!animationActive} togglePause={togglePause} />
            <button type="button" onClick={goToNext} className={styles.iconButton} aria-label="Avantage suivant">
              <span className="fr-icon-arrow-right-s-line" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className={styles.cta}>
          <Button
            iconId="fr-icon-arrow-right-line"
            iconPosition="right"
            linkProps={{ href: "/auth/inscription/organisme_formation" }}
          >
            Commencer à collaborer
          </Button>
        </div>
      </div>
    </section>
  );
}
