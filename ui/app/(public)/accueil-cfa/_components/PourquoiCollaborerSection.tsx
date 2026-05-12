"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Image from "next/image";

import { useInViewOnce } from "../../_hooks/useInViewOnce";

import styles from "./pourquoi-collaborer-section.module.scss";

type Aide = { iconClass: string; label: React.ReactNode };

const AIDES: Array<Aide> = [
  {
    iconClass: fr.cx("fr-icon-community-line"),
    label: (
      <>
        Aides
        <br />
        au logement
      </>
    ),
  },
  {
    iconClass: fr.cx("fr-icon-stethoscope-line"),
    label: (
      <>
        Aides
        <br />à l’accès aux soins
      </>
    ),
  },
  {
    iconClass: fr.cx("fr-icon-file-text-line"),
    label: (
      <>
        Aides
        <br />
        aux démarches administratives
      </>
    ),
  },
  {
    iconClass: fr.cx("fr-icon-bike-line"),
    label: (
      <>
        Aides
        <br />à la mobilité
      </>
    ),
  },
  { iconClass: fr.cx("fr-icon-computer-line"), label: "Accompagnement au numérique" },
  { iconClass: fr.cx("fr-icon-money-euro-circle-line"), label: "Aides financières" },
  { iconClass: fr.cx("fr-icon-team-line"), label: "Soutien dans la médiation sociale" },
];

export function PourquoiCollaborerSection() {
  const { ref: imageBandRef, hasEntered } = useInViewOnce<HTMLDivElement>({ threshold: 0.15 });

  return (
    <section className={styles.section}>
      <div
        ref={imageBandRef}
        className={`${styles.imageBand} ${hasEntered ? styles.fadeInUp : styles.fadeInUpInitial}`}
      >
        <div className={styles.imageBackplate} aria-hidden="true">
          <Image
            src="/images/home/cfa/contrat-rompu-cfa.png"
            alt="Illustration de contrats d’apprentissage déchirés"
            width={486}
            height={397}
            sizes="(max-width: 768px) calc(100vw - 32px), 486px"
            className={styles.image}
          />
        </div>
        <div className={styles.imageFade} aria-hidden="true" />
      </div>
      <div className={styles.titleBlock}>
        <p className={styles.eyebrow}>Pourquoi collaborer avec les Missions Locales ?</p>
        <h2 className={styles.title}>
          Quand la rupture s’installe et dure, la Mission Locale apporte ses solutions{" "}
          <span className={styles.titleAccent}>pédagogiques</span>, <span className={styles.titleAccent}>humaines</span>{" "}
          et <span className={styles.titleAccent}>matérielles</span>.
        </h2>
      </div>
      <p className={styles.subtitle}>Les freins périphériques pour lesquels la Mission Locale agit</p>
      <div className={styles.aidesGrid}>
        {AIDES.map((aide, idx) => (
          <div key={idx} className={styles.aideCard}>
            <div className={styles.aideIconWrapper} aria-hidden="true">
              <span className={`${aide.iconClass} ${styles.aideIcon}`} />
            </div>
            <p className={styles.aideLabel}>{aide.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
