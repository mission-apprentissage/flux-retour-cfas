"use client";

import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import Image from "next/image";
import { usePathname } from "next/navigation";

import styles from "./StatistiquesLayoutClient.module.css";

const SyntheseLabel = () => (
  <>
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.syntheseIcon}
    >
      <path
        d="M2.75 11H6.41667V19.25H2.75V11ZM15.5833 7.33331H19.25V19.25H15.5833V7.33331ZM9.16667 1.83331H12.8333V19.25H9.16667V1.83331Z"
        fill="#000091"
      />
    </svg>
    Synthèse
  </>
);

const NationalLabel = () => (
  <>
    <Image src="/images/france-icon.svg" alt="France" width={22} height={22} className={styles.syntheseIcon} />
    National
  </>
);

export function StatistiquesLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const sideMenuItems = [
    {
      text: <SyntheseLabel />,
      linkProps: {
        href: "/admin/suivi-des-indicateurs",
      },
      isActive: pathname === "/admin/suivi-des-indicateurs",
    },
    {
      text: <NationalLabel />,
      linkProps: {
        href: "/admin/suivi-des-indicateurs/national",
      },
      isActive: pathname === "/admin/suivi-des-indicateurs/national",
    },
  ];

  return (
    <>
      <div className={styles.bannerContainer}>
        <div className={styles.bannerContent}>
          <h1 className={styles.bannerTitle}>Suivi de l&lsquo;activité des Missions locales sur le service</h1>
        </div>
      </div>

      <div className={styles.mainContainer}>
        <div className="fr-container">
          <div className="fr-grid-row">
            <div className={`fr-col-12 fr-col-md-2 ${styles.sideMenuColumn}`}>
              <SideMenu
                align="left"
                burgerMenuButtonText="Dans cette rubrique"
                sticky={true}
                items={sideMenuItems}
                className={styles.sideMenuContainer}
              />
            </div>

            <div className={`fr-col-12 fr-col-md-10 ${styles.contentColumn}`}>{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}
