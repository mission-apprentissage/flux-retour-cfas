"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";

import { useInfiniteCarousel } from "../../_hooks/useInfiniteCarousel";

import styles from "./base-processus-section.module.scss";
import { PauseButton } from "./PauseButton";

type LinkInscription = "/missions_locales" | "/operateur_public" | "/organisme_formation";

export type ProcessusCard = {
  image: string;
  title: string;
};

const TRANSITION_DURATION = 500;

export function BaseProcessusSection({
  title,
  subtitle = "Moins de courriels qui se perdent, moins de temps à chercher les contacts dans un annuaire de Missions Locales. Concentrez-vous sur l’accompagnement.",
  cards,
  linkInscription,
  ariaLabel = "Avantages de la collaboration sur le Tableau de bord",
}: {
  title: string;
  subtitle?: string;
  cards: Array<ProcessusCard>;
  linkInscription: LinkInscription;
  ariaLabel?: string;
}) {
  const count = cards.length;
  const trackCards = [...cards, ...cards, ...cards];

  const { position, transitionEnabled, animationActive, activeIndex, goToNext, goToPrevious, togglePause } =
    useInfiniteCarousel({ count });

  return (
    <section className={styles.section} aria-roledescription="carrousel" aria-label={ariaLabel}>
      <div className={styles.contentWrapper}>
        <div className={styles.intro}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>

      <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
        Avantage {activeIndex + 1} sur {count} — {cards[activeIndex].title}.
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
          {trackCards.map((card, index) => {
            const isActive = index === position;
            return (
              <article
                key={`${card.title}-${index}`}
                className={styles.card}
                aria-roledescription="diapositive"
                aria-label={`${(index % count) + 1} sur ${count}`}
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
          {cards.map((card, index) => (
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
            linkProps={{ href: `/auth/inscription${linkInscription}` }}
          >
            Commencer à collaborer
          </Button>
        </div>
      </div>
    </section>
  );
}
