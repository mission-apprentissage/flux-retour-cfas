"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";

import { LOCAL_STORAGE_KEYS } from "@/app/_constants/localStorage";

import { useDismissible } from "../shared/hooks";
import { DismissButton } from "../shared/ui/DismissButton";

import styles from "./CfaWelcomeCard.module.css";

export function CfaWelcomeCard() {
  const { visible, dismiss } = useDismissible(LOCAL_STORAGE_KEYS.CFA_V2_WELCOME_CARD_DISMISSED);

  if (!visible) return null;

  return (
    <section className={styles.card} aria-labelledby="cfa-welcome-title">
      <DismissButton onDismiss={dismiss} label="Fermer la carte de bienvenue" className={styles.close} />

      <div className={styles.content}>
        <p className={styles.badge}>Mise à jour - Rentrée 2026</p>
        <p id="cfa-welcome-title" className={styles.title}>
          Bienvenue sur la nouvelle version du Tableau de bord de l&apos;apprentissage
        </p>
        <p className={styles.text}>
          Le Tableau de bord de l&apos;apprentissage devient l&apos;outil national de collaboration entre les CFA et les
          Missions Locales.
        </p>
        <p className={styles.text}>
          Un jeune a des difficultés, pour lutter contre le décrochage après une rupture, un abandon ou pour trouver des
          solutions en prévention de rupture, adoptez le réflexe d&apos;une collaboration simplifiée et automatisée avec
          les Missions Locales de rattachement des jeunes.
        </p>
        <Button priority="primary" linkProps={{ href: "/cfa/a-propos" }}>
          En savoir plus sur cette mise à jour
        </Button>
      </div>

      <Image
        src="/images/cfa-nouvelle-version/bienvenue-illustration.png"
        alt=""
        width={486}
        height={431}
        className={styles.illustration}
      />
    </section>
  );
}
