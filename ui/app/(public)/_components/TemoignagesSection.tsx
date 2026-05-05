"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { useInfiniteCarousel } from "../_hooks/useInfiniteCarousel";

import { PauseButton } from "./PauseButton";
import styles from "./temoignages-section.module.scss";

type Temoignage = {
  id: string;
  avatar: string;
  text: string;
  author?: string;
  role?: string;
};

const TEMOIGNAGES: Array<Temoignage> = [
  {
    id: "campus-du-lac",
    avatar: "/images/home/temoignages/campus-du-lac.png",
    text: "Ce qui est très intéressant c’est qu’on n’est pas noyé par la paperasse, pas noyés par les process c’est extrêmement simple.",
    author: "Sandrine ABOAB",
    role: "Directrice pédagogique, CFA Campus du Lac, Bordeaux",
  },
  {
    id: "ccca-btp",
    avatar: "/images/home/temoignages/ccca-btp.png",
    text: "Vous nous amenez un outil simple, efficace, gratuit et qui n’existait pas pour la lutte contre les ruptures, je ne vois pas quel CFA pourrait ne pas vouloir de cet outil.",
    author: "Nicolas DE ARAUJO",
    role: "Responsable des projets socio-éducatifs, CCCA BTP France",
  },
  {
    id: "genech",
    avatar: "/images/home/temoignages/groupe-institut-de-genech.png",
    text: "Un outil indispensable à mettre en place pour renforcer l’accompagnement du jeune et améliorer la collaboration professionnelle des CFA et Missions Locales.",
    author: "Accompagnateur jeune",
    role: "CFA Institut de Genech",
  },
  {
    id: "vallees",
    avatar: "/images/home/temoignages/mission-locale-3-vallees.png",
    text: "On gagne en réactivité sur les parcours des jeunes qui recherchent une solution, on est plus proche des CFA, on actualise plus facilement les dossiers des jeunes déjà connus et accompagnés par la Mission Locale.",
    author: "Responsable d’équipe",
    role: "Mission Locale des 3 Vallées, Brétigny-sur-Orge",
  },
  {
    id: "antipolis",
    avatar: "/images/home/temoignages/mission-locale-antipolis.png",
    text: "Nous l’utilisons depuis peu, mais il est en train de devenir un vrai outil dans nos pratiques professionnelles au quotidien, en nous permettant de repérer au plus vite les décrocheurs d’alternance pour les remobiliser et leur proposer un accompagnement par notre équipe. Très pratique et hyper facile à utiliser, c’est une vraie aide, et il va faciliter les partenariats avec les CFA.",
    author: "Directrice adjointe",
    role: "Mission Locale Antipolis, Antibes",
  },
];

function TemoignageCard({
  temoignage,
  index,
  isActive,
  isExpanded,
  onToggleExpand,
}: {
  temoignage: Temoignage;
  index: number;
  isActive: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const blockquoteRef = useRef<HTMLQuoteElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Détecte dynamiquement si le texte déborde de la card pour décider d'afficher
  // le bouton « Lire le témoignage complet ». Re-vérifie au resize
  useEffect(() => {
    const element = blockquoteRef.current;
    if (!element) return;
    const checkOverflow = () => {
      setIsOverflowing(element.scrollHeight > element.clientHeight + 1);
    };
    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, [temoignage.text]);

  const showExpandButton = isOverflowing || isExpanded;

  return (
    <article
      className={`${styles.card} ${isExpanded ? styles.cardExpanded : ""}`}
      aria-roledescription="diapositive"
      aria-label={`${(index % NOMBRE_TEMOIGNAGES) + 1} sur ${NOMBRE_TEMOIGNAGES}`}
      aria-hidden={!isActive}
    >
      <div className={styles.avatar} aria-hidden="true">
        <Image src={temoignage.avatar} alt="" fill sizes="80px" />
      </div>
      <div className={styles.separator} aria-hidden="true" />
      <div className={styles.content}>
        <blockquote
          ref={blockquoteRef}
          className={`${styles.temoignageText} ${isOverflowing && !isExpanded ? styles.temoignageTextTruncated : ""}`}
        >
          <span className={`fr-icon-quote-line ${styles.temoignageIcon}`} aria-hidden="true" />« {temoignage.text} »
        </blockquote>
        {showExpandButton && (
          <button type="button" onClick={onToggleExpand} className={styles.expandButton} aria-expanded={isExpanded}>
            {isExpanded ? "Réduire le témoignage" : "Lire le témoignage complet"}
          </button>
        )}
        <div className={styles.source}>
          <p className={styles.author}>{temoignage.author}</p>
          <p className={styles.role}>{temoignage.role}</p>
        </div>
      </div>
    </article>
  );
}

const NOMBRE_TEMOIGNAGES = TEMOIGNAGES.length;
// Triple le tableau pour simuler un défilement infini
const TRACK_TEMOIGNAGES = [...TEMOIGNAGES, ...TEMOIGNAGES, ...TEMOIGNAGES];
const TRANSITION_DURATION = 500;

type LinkInscription = "/missions_locales" | "/operateur_public" | "/organisme_formation";

export function TemoignagesSection({ linkInscription }: { linkInscription?: LinkInscription }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  }, []);

  const { position, transitionEnabled, animationActive, activeIndex, goToNext, goToPrevious, togglePause } =
    useInfiniteCarousel({ count: NOMBRE_TEMOIGNAGES, extraPaused: expandedId !== null });

  const activeTemoignage = TEMOIGNAGES[activeIndex];

  return (
    <section
      className={styles.section}
      aria-roledescription="carrousel"
      aria-label="Témoignages d’utilisateurs du Tableau de bord"
    >
      <div className={styles.contentWrapper}>
        <h2 className={styles.title}>Les mots de ceux qui ont adopté l’outil de collaboration</h2>
      </div>

      <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
        Témoignage {activeIndex + 1} sur {NOMBRE_TEMOIGNAGES} — {activeTemoignage.author}, {activeTemoignage.role}.
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
          {TRACK_TEMOIGNAGES.map((temoignage, index) => {
            const isActive = index === position;
            return (
              <TemoignageCard
                key={`${temoignage.id}-${index}`}
                temoignage={temoignage}
                index={index}
                isActive={isActive}
                isExpanded={expandedId === temoignage.id}
                onToggleExpand={() => toggleExpand(temoignage.id)}
              />
            );
          })}
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.progress} aria-hidden="true">
          {TEMOIGNAGES.map((temoignage, index) => (
            <div
              key={temoignage.id}
              className={index === activeIndex ? styles.progressStepActive : styles.progressStep}
            />
          ))}
        </div>

        <div className={styles.controls}>
          <button type="button" onClick={goToPrevious} className={styles.iconButton} aria-label="Témoignage précédent">
            <span className="fr-icon-arrow-left-s-line" aria-hidden="true" />
          </button>
          <div className={styles.controlsRight}>
            <PauseButton isPaused={!animationActive} togglePause={togglePause} />
            <button type="button" onClick={goToNext} className={styles.iconButton} aria-label="Témoignage suivant">
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
