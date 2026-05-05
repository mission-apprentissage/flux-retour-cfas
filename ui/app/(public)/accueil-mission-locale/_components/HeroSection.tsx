"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";

import { PauseButton } from "../../_components/PauseButton";
import { useGifPause, GIF_WIDTH, GIF_HEIGHT } from "../../_hooks/useGifPause";

import styles from "./hero-section.module.scss";

export function HeroSection() {
  const { isPaused, togglePause, imgRef, canvasRef } = useGifPause();

  return (
    <section className={styles.section}>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>
          L’outil de <span className={styles.titleHighlight}>repérage</span> des jeunes en{" "}
          <span className={styles.titleHighlight}>rupture de contrat d’apprentissage</span> et de{" "}
          <span className={styles.titleHighlight}>collaboration avec les CFA.</span> Soutenons l’insertion des
          apprentis.
        </h1>
        <p className={styles.subtitle}>Pour les Missions locales</p>
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
            linkProps={{ href: "/auth/inscription/missions_locales" }}
          >
            Accéder au Tableau de bord
          </Button>
        </div>
        <div className={styles.dashboardPreviewContainer}>
          <div className={styles.dashboardPreviewMedia}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src="/images/home/hero.gif"
              alt="Aperçu animé du Tableau de bord pour les CFA"
              width={GIF_WIDTH}
              height={GIF_HEIGHT}
              className={styles.dashboardPreview}
              style={{ visibility: isPaused ? "hidden" : "visible" }}
            />
            <canvas
              ref={canvasRef}
              width={GIF_WIDTH}
              height={GIF_HEIGHT}
              className={styles.dashboardPreviewFrozen}
              style={{ visibility: isPaused ? "visible" : "hidden" }}
              aria-hidden="true"
            />
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
