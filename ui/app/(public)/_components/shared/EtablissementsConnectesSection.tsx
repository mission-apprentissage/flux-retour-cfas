"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

import { useReducedMotion } from "../../_hooks/useReducedMotion";

import styles from "./etablissements-connectes-section.module.scss";
import { PauseButton } from "./PauseButton";

// Feature flag temporaire : passer à `true` pour réactiver le défilement automatique.
const AUTO_SCROLL_ENABLED = false;

const LOGOS = [
  { src: "/images/home/etablissements/campus-du-lac.png", alt: "Campus du Lac" },
  {
    src: "/images/home/etablissements/cma-nouvelle-aquitaine.png",
    alt: "CMA — Chambre des métiers et de l’artisanat - Nouvelle-Aquitaine",
  },
  { src: "/images/home/etablissements/cci-auvergne-rhone-alpes.png", alt: "CCI Auvergne-Rhône-Alpes" },
  { src: "/images/home/etablissements/btp-cfa-picardie.png", alt: "BTP-CFA Picardie" },
  { src: "/images/home/etablissements/ccca-btp.png", alt: "CCCA BTP" },
  { src: "/images/home/etablissements/groupe-institut-de-genech.png", alt: "Groupe Institut de Genech" },
  // { src: "/images/home/etablissements/greta-cfa-alpes-provence.png", alt: "Greta-CFA Alpes Provence" },
  // { src: "/images/home/etablissements/apprentis-auteuil.png", alt: "Apprentis d’Auteuil" },
  // { src: "/images/home/etablissements/creps-hauts-de-france-btp.png", alt: "Creps - Hauts-de-France" },
  // { src: "/images/home/etablissements/groupe-institut-de-genech.png", alt: "Groupe Institut de Genech" },
  // { src: "/images/home/etablissements/mission-locale-3-vallees.png", alt: "Mission Locale 3 Vallées" },
  // { src: "/images/home/etablissements/mission-locale-antipolis.png", alt: "Mission Locale Antipolis" },
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

      <div className={styles.carousel} data-scroll-enabled={AUTO_SCROLL_ENABLED}>
        <div className={styles.track} aria-hidden="true">
          {(AUTO_SCROLL_ENABLED ? TRACK_LOGOS : LOGOS).map((logo, index) => (
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

      {AUTO_SCROLL_ENABLED && (
        <div className={styles.controls}>
          <PauseButton isPaused={!animationActive} togglePause={togglePause} />
        </div>
      )}
    </section>
  );
}
