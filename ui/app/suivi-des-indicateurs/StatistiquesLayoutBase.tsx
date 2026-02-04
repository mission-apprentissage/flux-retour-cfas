"use client";

import { SideMenu, type SideMenuProps } from "@codegouvfr/react-dsfr/SideMenu";

import { DecaAlert } from "@/app/_components/statistiques/ui/DecaAlert";
import { Skeleton } from "@/app/_components/statistiques/ui/Skeleton";

import styles from "./StatistiquesMLLayoutClient.module.css";

interface StatistiquesLayoutBaseProps {
  children: React.ReactNode;
  sideMenuItems: SideMenuProps.Item[];
  isCollapsed?: boolean;
  isLoading?: boolean;
}

export function StatistiquesLayoutBase({
  children,
  sideMenuItems,
  isCollapsed = false,
  isLoading = false,
}: StatistiquesLayoutBaseProps) {
  if (isLoading) {
    return (
      <>
        <Banner />
        <div className={styles.mainContainer}>
          <div className="fr-container">
            <div className="fr-grid-row">
              <div className={`fr-col-12 fr-col-md-3 ${styles.sideMenuColumn}`}>
                <div style={{ padding: "16px" }}>
                  <Skeleton height="32px" width="80%" className={styles.skeletonMarginBottom} />
                  <Skeleton height="32px" width="70%" className={styles.skeletonMarginBottom} />
                  <Skeleton height="32px" width="60%" className={styles.skeletonMarginBottom} />
                  <Skeleton height="32px" width="75%" />
                </div>
              </div>
              <div className={`fr-col-12 fr-col-md-9 ${styles.contentColumn}`}>
                <Skeleton height="40px" width="200px" className={styles.skeletonMarginBottom} />
                <Skeleton height="200px" className={styles.skeletonMarginBottom} />
                <Skeleton height="300px" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Banner />
      <div className="fr-container fr-mt-2w fr-mb-3w">
        <DecaAlert />
      </div>
      <div className={styles.mainContainer}>
        <div className="fr-container">
          <div className="fr-grid-row">
            <div
              className={`fr-col-12 ${isCollapsed ? "fr-col-md-1" : "fr-col-md-3"} ${styles.sideMenuColumn} ${isCollapsed ? styles.sideMenuColumnCollapsed : ""}`}
            >
              <SideMenu
                align="left"
                burgerMenuButtonText="Dans cette rubrique"
                sticky={true}
                items={sideMenuItems}
                className={`${styles.sideMenuContainer} ${isCollapsed ? styles.sideMenuCollapsed : ""}`}
              />
            </div>

            <div className={`fr-col-12 ${isCollapsed ? "fr-col-md-11" : "fr-col-md-9"} ${styles.contentColumn}`}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Banner() {
  return (
    <div className={styles.bannerContainer}>
      <div className={styles.bannerContent}>
        <h1 className={styles.bannerTitle}>Suivi de l&lsquo;activité des Missions Locales sur le service</h1>
      </div>
    </div>
  );
}
