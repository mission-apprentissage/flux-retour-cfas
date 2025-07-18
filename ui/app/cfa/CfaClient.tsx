"use client";

import Link from "next/link";
import { useState } from "react";

import styles from "./CfaClient.module.css";

export default function CfaClient() {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Liste des jeunes en rupture de 16 à 25 ans</h1>
      <p className={styles.description}>
        <strong>
          Nous affichons sur le Tableau de bord tous les jeunes ayant un statut de rupture dans votre ERP, en les
          classant par date de rupture (du plus récent au plus ancien).
        </strong>
      </p>
      <div className={styles.accordionWrapper} onClick={toggleExpanded}>
        <p className={styles.accordionLabel}>
          Pourquoi les jeunes de 16 à 25 ans ?
          <span
            className={`${styles.accordionIcon} ${isExpanded ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"}`}
          />
        </p>
        {isExpanded && (
          <div className={styles.accordionContent}>
            <p className={styles.accordionText}>
              Cette liste de jeune est rendue accessible dans le cadre d&apos;une{" "}
              <strong>
                expérimentation qui a pour objectif de renforcer le partenariat entre les organismes de formations en
                apprentissage et les Missions Locales
              </strong>
              . Elle affiche donc uniquement les jeunes éligibles à l&apos;offre de services des Missions Locales : les
              jeunes de 16 à 25 ans.{" "}
              <Link
                href="https://travail-emploi.gouv.fr/les-missions-locales"
                target="_blank"
                rel="noopener noreferrer"
              >
                Cliquer ici pour en savoir plus sur les Missions Locales
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
