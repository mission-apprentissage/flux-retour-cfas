"use client";

import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import { usePathname } from "next/navigation";
import { REGIONS_BY_CODE, REGION_CODES_WITH_SVG, REGIONS_WITH_SVG_SORTED } from "shared/constants/territoires";

import { FranceIcon } from "@/app/_components/statistiques/ui/FranceIcon";
import { FranceMapSVG } from "@/app/_components/statistiques/ui/FranceMapSVG";
import { RegionSVG } from "@/app/_components/statistiques/ui/RegionSVG";

import styles from "./StatistiquesLayoutClient.module.css";

const DEFAULT_REGION_CODE = "84";

const SyntheseLabel = ({ isActive }: { isActive: boolean }) => (
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
        fill={isActive ? "#000091" : "#CECECE"}
      />
    </svg>
    Synthèse
  </>
);

const NationalLabel = ({ isActive }: { isActive: boolean }) => (
  <>
    <FranceIcon isActive={isActive} width={22} height={22} className={styles.syntheseIcon} />
    National
  </>
);

const RegionsLabel = ({ isActive }: { isActive: boolean }) => (
  <>
    <div
      className={styles.regionsIcon}
      style={{
        filter: isActive ? "none" : "grayscale(100%)",
        opacity: isActive ? 1 : 0.6,
      }}
    >
      <FranceMapSVG regionsActives={[...REGION_CODES_WITH_SVG]} />
    </div>
    Par région
  </>
);

const RegionItemLabel = ({ regionCode, isActive }: { regionCode: string; isActive: boolean }) => {
  const region = REGIONS_BY_CODE[regionCode as keyof typeof REGIONS_BY_CODE];
  return (
    <>
      <RegionSVG regionCode={regionCode} className={styles.regionItemIcon} fill={isActive ? "#6A6AF4" : "#CECECE"} />
      {region?.nom || regionCode}
    </>
  );
};

export function StatistiquesLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isRegionPage = pathname.includes("/admin/suivi-des-indicateurs/region/");

  const currentRegionCode = isRegionPage ? pathname.split("/region/")[1]?.split("/")[0] : null;

  const regionMenuHref = isRegionPage ? pathname : `/admin/suivi-des-indicateurs/region/${DEFAULT_REGION_CODE}`;

  const sideMenuItems = [
    {
      text: <SyntheseLabel isActive={pathname === "/admin/suivi-des-indicateurs"} />,
      linkProps: {
        href: "/admin/suivi-des-indicateurs",
      },
      isActive: pathname === "/admin/suivi-des-indicateurs",
    },
    {
      text: <NationalLabel isActive={pathname === "/admin/suivi-des-indicateurs/national"} />,
      linkProps: {
        href: "/admin/suivi-des-indicateurs/national",
      },
      isActive: pathname === "/admin/suivi-des-indicateurs/national",
    },
    {
      text: <RegionsLabel isActive={isRegionPage} />,
      linkProps: {
        href: regionMenuHref,
      },
      isActive: isRegionPage,
      expandedByDefault: isRegionPage,
      items: REGIONS_WITH_SVG_SORTED.map((region) => ({
        text: <RegionItemLabel regionCode={region.code} isActive={currentRegionCode === region.code} />,
        linkProps: {
          href: `/admin/suivi-des-indicateurs/region/${region.code}`,
        },
        isActive: currentRegionCode === region.code,
      })),
    },
  ];

  return (
    <>
      <div className={styles.bannerContainer}>
        <div className={styles.bannerContent}>
          <h1 className={styles.bannerTitle}>Suivi de l&lsquo;activité des Missions Locales sur le service</h1>
        </div>
      </div>

      <div className={styles.mainContainer}>
        <div className="fr-container">
          <div className="fr-grid-row">
            <div className={`fr-col-12 fr-col-md-3 ${styles.sideMenuColumn}`}>
              <SideMenu
                align="left"
                burgerMenuButtonText="Dans cette rubrique"
                sticky={true}
                items={sideMenuItems}
                className={styles.sideMenuContainer}
              />
            </div>

            <div className={`fr-col-12 fr-col-md-9 ${styles.contentColumn}`}>{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}
