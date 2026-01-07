"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";

import styles from "./ServiceDiscontinuedPage.module.css";

interface ContactCardProps {
  role: string;
  name: string;
  email: string;
}

function ContactCard({ role, name, email }: ContactCardProps) {
  return (
    <div className={styles.contactCard}>
      <div className={styles.contactCardContent}>
        <div className={styles.contactCardIcon}>
          <i className={fr.cx("fr-icon-user-fill")}></i>
        </div>
        <div className={styles.contactCardInfo}>
          <Badge small noIcon className={styles.contactCardBadge}>
            {role}
          </Badge>
          <span className={styles.contactCardName}>{name}</span>
          <a href={`mailto:${email}`} className={styles.contactCardEmail}>
            {email}
          </a>
        </div>
      </div>
      <div className={styles.contactCardMailIcon}>
        <i className={fr.cx("fr-icon-mail-line")}></i>
      </div>
    </div>
  );
}

interface ServiceDiscontinuedPageProps {
  userName: string;
  organisationLabel: string;
}

export function ServiceDiscontinuedPage({ userName, organisationLabel }: ServiceDiscontinuedPageProps) {
  return (
    <div className={styles.container}>
      <div className={styles.welcomeBanner}>
        <h1 className={styles.title}>Bienvenue {userName}</h1>
        <p className={styles.subtitle}>{organisationLabel}</p>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.icon}>
          <i className={fr.cx("fr-icon-paint-brush-fill")}></i>
        </div>

        <h2 className={styles.mainTitle}>
          Le Tableau de Bord de l&apos;Apprentissage
          <br />
          se renouvelle
        </h2>

        <div className={styles.textContent}>
          <p className={styles.paragraph}>
            Le Tableau de Bord de l&apos;Apprentissage évolue pour servir au mieux les publics en apprentissage. Depuis
            le mois de décembre 2025, le Tableau de Bord de l&apos;Apprentissage est devenu un outil opérationnel de
            mise en relation des CFA et du Service Public à l&apos;Emploi (Missions Locales et France Travail) pour
            collaborer main dans la main dans le suivi des jeunes en apprentissage.
          </p>

          <p className={styles.paragraph}>
            Pour servir au mieux ce nouvel objectif, l&apos;ensemble des efforts de l&apos;équipe se concentrent sur ces
            fonctionnalités. Les fonctionnalités historiques de pilotage et de suivi de chiffres ne sont donc plus
            maintenues.
          </p>

          <p className={styles.paragraph}>
            Si vous souhaitez avoir plus d&apos;informations ou suivre l&apos;évolution du service, n&apos;hésitez pas à
            prendre contact avec l&apos;équipe du service.
          </p>
        </div>

        <div className={styles.contactsSection}>
          <p className={styles.contactsTitle}>
            Les responsables du projet se tiennent à votre
            <br />
            écoute pour répondre à vos questions
          </p>

          <div className={styles.contactsGrid}>
            <ContactCard role="Chef de projet" name="Alameen Abdul" email="alameen.abdul@beta.gouv.fr" />
            <ContactCard role="Chargé de support" name="Paul-Boris Bouzin" email="paul-boris.bouzin@beta.gouv.fr" />
          </div>
        </div>
      </div>
    </div>
  );
}
