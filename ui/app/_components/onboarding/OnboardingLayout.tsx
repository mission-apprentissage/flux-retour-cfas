import type { ReactNode } from "react";

import styles from "./OnboardingLayout.module.scss";

type OnboardingLayoutProps = {
  sidebar: ReactNode;
  title: ReactNode;
  children: ReactNode;
};

/**
 * Layout d'onboarding (sidebar + main) partagé entre l'inscription CFA et la
 * connexion en mode invitation. Chaque colonne porte son propre fond qui
 * saigne jusqu'au bord de viewport (parent `.main` du layout public en `100vw`).
 * Basculement responsive en colonnes empilées < 768px.
 */
export function OnboardingLayout({ sidebar, title, children }: OnboardingLayoutProps) {
  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>{sidebar}</div>
      <div className={styles.main}>
        <div className={styles.content}>
          <h1 className={styles.title}>{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
