"use client";

import { Stepper } from "@codegouvfr/react-dsfr/Stepper";
import type { ReactNode } from "react";

import styles from "./auth-card.module.scss";

export type AuthCardStep = {
  current: number;
  total: number;
  title: string;
  nextTitle?: string;
};

export function AuthCard({
  title,
  step,
  maxWidth = 600,
  children,
  footer,
}: {
  title: string;
  step?: AuthCardStep;
  maxWidth?: number;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className={styles.wrapper}>
      <div className={styles.card} style={{ maxWidth: `${maxWidth}px` }}>
        <h1 className={styles.title}>{title}</h1>

        {step && (
          <Stepper currentStep={step.current} stepCount={step.total} title={step.title} nextTitle={step.nextTitle} />
        )}

        {children}

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </main>
  );
}
