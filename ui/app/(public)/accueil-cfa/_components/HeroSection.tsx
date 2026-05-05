"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";

import { PauseButton } from "../../_components/PauseButton";
import { useVideoPause } from "../../_hooks/useVideoPause";

import styles from "./hero-section.module.scss";

export function HeroSection() {
  const { isPaused, togglePause, videoRef } = useVideoPause();

  return (
    <section className={styles.section}>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>
          L’outil de <span className={styles.titleHighlight}>collaboration avec les Missions Locales</span> pour{" "}
          <span className={styles.titleHighlight}>l’accompagnement</span> des{" "}
          <span className={styles.titleHighlight}>jeunes en rupture</span> de{" "}
          <span className={styles.titleHighlight}>contrat d’apprentissage</span>.
        </h1>
        <p className={styles.subtitle}>Pour les CFA</p>
      </div>
      <div className={styles.heroBlock}>
        <div className={styles.figuresBand} aria-hidden="true">
          <Image
            unoptimized
            src="/images/home/hero-cfa-figure.png"
            alt=""
            width={177}
            height={150}
            priority
            className={styles.cfaFigure}
          />
          <Image unoptimized src="/images/home/hero-cafe.png" alt="" width={33} height={66} className={styles.cafe} />
          <Image
            unoptimized
            src="/images/home/hero-plante.png"
            alt=""
            width={73}
            height={100}
            className={styles.plante}
          />
          <Image
            unoptimized
            src="/images/home/hero-ml-figure.png"
            alt=""
            width={184}
            height={146}
            priority
            className={styles.mlFigure}
          />
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
        <div className={styles.dashboardPreviewContainer}>
          <div className={styles.dashboardPreviewMedia}>
            <video
              ref={videoRef}
              className={styles.dashboardPreview}
              width={996}
              height={560}
              poster="/videos/hero-poster.webp"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Aperçu animé du Tableau de bord pour les CFA"
            >
              <source src="/videos/hero.webm" type="video/webm" />
              <source src="/videos/hero.mp4" type="video/mp4" />
            </video>
            <PauseButton
              isPaused={isPaused}
              togglePause={togglePause}
              style={{ position: "absolute", bottom: "1.5rem", right: "1.5rem" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
