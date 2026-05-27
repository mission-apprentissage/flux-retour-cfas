"use client";

import { fr } from "@codegouvfr/react-dsfr";
import NextLink from "next/link";
import { Fragment, ReactNode, useState } from "react";

import styles from "./OnboardingSidePanel.module.scss";

export type OnboardingBreadcrumbItem = {
  label: string;
  /** Pas de href → item courant (non cliquable). */
  href?: string;
};

export type OnboardingMlItem = {
  id: string;
  nom: string;
  subtext?: string;
};

type OnboardingSidePanelProps = {
  breadcrumb?: OnboardingBreadcrumbItem[];
  illustration: { src: string; alt: string };
  intro: ReactNode;
  cfaCount?: number;
  missionsLocales?: OnboardingMlItem[];
  mlVisibleByDefault?: number;
  /**
   * Si non fourni, le bloc ML est masqué quand `missionsLocales` est vide
   * (comportement de l'inscription CFA, où l'absence n'a pas de sens à thématiser).
   */
  emptyMlMessage?: ReactNode;
};

export function OnboardingSidePanel({
  breadcrumb,
  illustration,
  intro,
  cfaCount,
  missionsLocales,
  mlVisibleByDefault = 5,
  emptyMlMessage,
}: OnboardingSidePanelProps) {
  const [showAllMl, setShowAllMl] = useState(false);
  const mlList = missionsLocales ?? [];
  const visibleMl = showAllMl ? mlList : mlList.slice(0, mlVisibleByDefault);
  const hasMoreMl = mlList.length > mlVisibleByDefault;
  const hasCfaCount = typeof cfaCount === "number" && cfaCount > 0;
  const hasMlBlock = mlList.length > 0;
  const showEmptyMlBlock = !hasMlBlock && Boolean(emptyMlMessage);

  return (
    <div className={styles.inner}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className={styles.breadcrumb}>
          {breadcrumb.map((item, idx) => (
            <Fragment key={`${item.label}-${idx}`}>
              {item.href ? (
                <NextLink href={item.href} className={styles.breadcrumbLink}>
                  {item.label}
                </NextLink>
              ) : (
                <span>{item.label}</span>
              )}
              {idx < breadcrumb.length - 1 && " > "}
            </Fragment>
          ))}
        </nav>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element -- illustration statique sans dimensions fixes */}
      <img src={illustration.src} alt={illustration.alt} className={styles.illustration} />
      <div className={styles.introContainer}>
        <p className={styles.intro}>{intro}</p>
      </div>
      <hr className={styles.separator} />

      {hasCfaCount && (
        <div className={styles.cfaCountBlock}>
          <i className={`${fr.cx("ri-lightbulb-line")} ${styles.cfaCountIcon}`} />
          <span>
            <strong>{cfaCount} CFA</strong> sur votre territoire ont déjà un compte sur le Tableau de bord et
            collaborent avec les Missions Locales.
          </span>
        </div>
      )}

      {hasMlBlock && (
        <div className={hasCfaCount ? styles.mlBlockWithSeparator : styles.mlBlock}>
          {hasCfaCount && <hr className={styles.mlSeparator} />}
          <p className={styles.mlTitle}>
            <span className={styles.mlTitleCount}>{mlList.length}</span> Missions Locales sont prêtes à collaborer avec
            vous sur le service
          </p>
          <ul className={styles.mlList}>
            {visibleMl.map((ml) => (
              <li key={ml.id} className={styles.mlItem}>
                <span className={styles.mlBullet}>&#9679;</span>
                <span>
                  <strong>Mission Locale {ml.nom}</strong>
                  {ml.subtext && (
                    <>
                      <br />
                      <span className={styles.mlSubtext}>{ml.subtext}</span>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {hasMoreMl && !showAllMl && (
            <div className={styles.mlShowMoreWrap}>
              <button type="button" onClick={() => setShowAllMl(true)} className={styles.mlShowMoreBtn}>
                Voir plus ({mlList.length - mlVisibleByDefault})
              </button>
            </div>
          )}
        </div>
      )}

      {showEmptyMlBlock && (
        <div className={hasCfaCount ? styles.mlBlockWithSeparator : styles.mlBlock}>
          {hasCfaCount && <hr className={styles.mlSeparator} />}
          <p className={styles.mlEmptyMessage}>{emptyMlMessage}</p>
        </div>
      )}
    </div>
  );
}
