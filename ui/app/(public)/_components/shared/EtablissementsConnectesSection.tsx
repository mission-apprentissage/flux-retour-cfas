"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

import { useReducedMotion } from "../../_hooks/useReducedMotion";

import styles from "./etablissements-connectes-section.module.scss";
import { PauseButton } from "./PauseButton";

const LOGOS = [
  { src: "/images/home/etablissements/logo-01.png", alt: "CCI Auvergne-Rhône-Alpes" },
  { src: "/images/home/etablissements/logo-02.png", alt: "MFR — Cultivons les réussites" },
  { src: "/images/home/etablissements/logo-03.png", alt: "BTP-CFA Picardie" },
  { src: "/images/home/etablissements/logo-04.png", alt: "Campus du Lac" },
  { src: "/images/home/etablissements/logo-05.png", alt: "Greta-CFA Alpes Provence" },
  { src: "/images/home/etablissements/logo-06.png", alt: "Crops" },
  { src: "/images/home/etablissements/logo-07.png", alt: "ESCG" },
  { src: "/images/home/etablissements/logo-08.png", alt: "CMA — Chambre des métiers et de l’artisanat" },
  { src: "/images/home/etablissements/logo-09.png", alt: "Apprentis d’Auteuil" },
];

// Track dupliqué pour donner l'illusion d'un défilement infini :
// quand l'animation atteint translateX(-50%) (= largeur d'une copie), elle reboucle
// à 0 — ce qui correspond visuellement à la même position grâce à la duplication.
const TRACK_LOGOS = [...LOGOS, ...LOGOS, ...LOGOS];

export function EtablissementsConnectesSection() {
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  const animationActive = !isPaused && !prefersReducedMotion;

  return (
    <section className={styles.section} aria-roledescription="carrousel" aria-label="Établissements connectés">
      <h2 className={styles.title}>
        Ces établissements sont déjà connectés aux Missions Locales grâce au Tableau de bord
      </h2>

      <div className={styles.carousel}>
        <div className={styles.track} data-paused={!animationActive} aria-hidden="true">
          {TRACK_LOGOS.map((logo, index) => (
            <Image
              key={`${logo.src}-${index}`}
              src={logo.src}
              alt={logo.alt}
              width={80}
              height={80}
              className={styles.logo}
            />
          ))}
        </div>
      </div>

      <div className={styles.controls}>
        <PauseButton isPaused={!animationActive} togglePause={togglePause} />
      </div>
    </section>
  );
}
