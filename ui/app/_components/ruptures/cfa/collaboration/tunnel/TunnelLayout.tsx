"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";
import { ReactNode } from "react";

import styles from "./Tunnel.module.css";

interface TunnelLayoutProps {
  tips: ReactNode[];
  stepNumber: 1 | 2 | 3;
  title?: string;
  nextStepLabel?: string;
  onBack?: () => void;
  backLabel?: string;
  onCancel: () => void;
  children: ReactNode;
  footer: ReactNode;
}

export function TunnelLayout({
  tips,
  stepNumber,
  title,
  nextStepLabel,
  onBack,
  backLabel = "Question précédente",
  onCancel,
  children,
  footer,
}: TunnelLayoutProps) {
  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <Button
            priority="tertiary no outline"
            iconId="fr-icon-close-line"
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Annuler et quitter
          </Button>

          <Image
            src="/images/cfa-nouvelle-version/bienvenue-illustration.png"
            alt=""
            width={486}
            height={431}
            priority
            className={styles.illustration}
          />

          {tips.map((tip, index) => (
            <div key={index} className={styles.tipCard}>
              <span className={styles.tipIcon} aria-hidden="true">
                💡
              </span>
              <p className={styles.tipText}>{tip}</p>
            </div>
          ))}
        </aside>

        <div className={styles.content}>
          {onBack && (
            <Button
              priority="tertiary no outline"
              iconId="fr-icon-arrow-left-line"
              onClick={onBack}
              className={styles.backButton}
            >
              {backLabel}
            </Button>
          )}

          <p className={styles.stepCounter}>Étape {stepNumber} sur 3</p>
          {title && <h1 className={styles.stepTitle}>{title}</h1>}

          <div
            className={styles.progressSegments}
            role="progressbar"
            aria-valuenow={stepNumber}
            aria-valuemin={1}
            aria-valuemax={3}
          >
            {[1, 2, 3].map((segment) => (
              <span
                key={segment}
                className={`${styles.progressSegment} ${segment <= stepNumber ? styles.progressSegmentActive : ""}`}
              />
            ))}
          </div>

          {nextStepLabel && <p className={styles.nextStep}>Étape suivante : {nextStepLabel}</p>}

          {children}

          <div className={styles.footer}>{footer}</div>
        </div>
      </div>
    </div>
  );
}
