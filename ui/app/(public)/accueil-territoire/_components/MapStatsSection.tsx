import Button from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";

import styles from "./map-stats-section.module.scss";

export function MapStatsSection() {
  return (
    <section className={styles.section}>
      <div className={styles.mapBackground} aria-hidden="true">
        <div className={styles.mapImageContainer}>
          <Image
            src="/images/home/territoire/carte.png"
            width={429}
            height={347}
            unoptimized
            alt="Carte de France des missions locales partenaires"
            sizes="(max-width: 768px) calc(100vw - 48px), 429px"
            className={styles.mapImage}
          />
        </div>
      </div>
      <div className={styles.titleBlock}>
        <h2 className={styles.title}>+200 Missions Locales · +XXX Établissements de formation</h2>
        <p className={styles.subtitle}>
          Une grande partie d’entre eux ne bénéficie d’aucun accompagnement. Les relations entre les CFA, les Missions
          Locales et l’ensemble des acteurs territoriaux existent déjà, le Tableau de bord leur donne un espace de
          centralisation pour faciliter l’accès à l’information et la collaboration.
        </p>
      </div>
      <div className={styles.cardDeploiement}>
        <div className={styles.cardColumn}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Le Tableau de bord n’est pas encore utilisé sur votre territoire ?</h3>
            <p className={styles.cardDescription}>
              Consultez notre guide de déploiement pour faire connaître et utiliser le service du Tableau de bord par
              les Missions Locales et/ou les établissements de formation de votre territoire.
            </p>
          </div>
          <Button
            iconId="fr-icon-external-link-line"
            iconPosition="right"
            linkProps={{
              href: "https://mission-apprentissage.notion.site/Kit-de-d-ploiement-Tableau-de-bord-de-l-apprentissage",
              target: "_blank",
              rel: "noopener noreferrer",
            }}
          >
            Consulter le kit de déploiement
          </Button>
        </div>
        <div className={styles.cardSeparator} aria-hidden="true" />
        <div className={styles.cardColumn}>
          <div className={styles.cardHeader}>
            <Image
              src="/images/home/territoire/paul-boris-bouzin.png"
              alt=""
              width={64}
              height={64}
              sizes="64px"
              className={styles.cardAvatar}
            />
            <h3 className={styles.cardTitle}>Prenez rendez-vous avec Paul-Boris Bouzin</h3>
            <p className={styles.cardDescription}>
              Responsable du déploiement du service Tableau de bord de l’apprentissage
            </p>
          </div>
          <Button
            iconId="fr-icon-external-link-line"
            iconPosition="right"
            linkProps={{
              href: "https://calendar.app.google/paul-boris-bouzin",
              target: "_blank",
              rel: "noopener noreferrer",
            }}
          >
            Prendre rendez-vous
          </Button>
        </div>
      </div>
    </section>
  );
}
