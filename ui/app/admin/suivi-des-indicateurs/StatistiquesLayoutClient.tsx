"use client";

import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import { usePathname } from "next/navigation";
import { REGIONS_BY_CODE, REGION_CODES_WITH_SVG, REGIONS_WITH_SVG_SORTED } from "shared/constants/territoires";

import { DecaAlert } from "@/app/_components/statistiques/ui/DecaAlert";
import { FranceIcon } from "@/app/_components/statistiques/ui/FranceIcon";
import { FranceMapSVG } from "@/app/_components/statistiques/ui/FranceMapSVG";
import { RegionSVG } from "@/app/_components/statistiques/ui/RegionSVG";

import styles from "./StatistiquesLayoutClient.module.css";

const DEFAULT_REGION_CODE = "84";

const SyntheseLabel = ({ isActive, collapsed }: { isActive: boolean; collapsed?: boolean }) => (
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
    {!collapsed && "Synthèse"}
  </>
);

const NationalLabel = ({ isActive, collapsed }: { isActive: boolean; collapsed?: boolean }) => (
  <>
    <FranceIcon isActive={isActive} width={22} height={22} className={styles.syntheseIcon} />
    {!collapsed && "National"}
  </>
);

const MissionLocaleLabel = ({ isActive, collapsed }: { isActive: boolean; collapsed?: boolean }) => (
  <>
    <i
      className={`ri-school-fill ${styles.syntheseIcon}`}
      style={{
        fontSize: "22px",
        color: isActive ? "#000091" : "#CECECE",
      }}
    />
    {!collapsed && "Par Mission Locale"}
  </>
);

const RegionsLabel = ({ isActive, collapsed }: { isActive: boolean; collapsed?: boolean }) => (
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
    {!collapsed && "Par région"}
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
  const isMissionLocalePage = pathname === "/admin/suivi-des-indicateurs/mission-locale";
  const isMissionLocaleDetailPage = pathname.match(/\/admin\/suivi-des-indicateurs\/mission-locale\/[^/]+$/);

  const currentRegionCode = isRegionPage ? pathname.split("/region/")[1]?.split("/")[0] : null;
  const isCollapsedMenu = !!isMissionLocaleDetailPage;

  const regionMenuHref = isRegionPage ? pathname : `/admin/suivi-des-indicateurs/region/${DEFAULT_REGION_CODE}`;

  const sideMenuItems = isCollapsedMenu
    ? [
        {
          text: <SyntheseLabel isActive={pathname === "/admin/suivi-des-indicateurs"} collapsed />,
          linkProps: {
            href: "/admin/suivi-des-indicateurs",
            title: "Synthèse",
          },
          isActive: pathname === "/admin/suivi-des-indicateurs",
        },
        {
          text: <NationalLabel isActive={pathname === "/admin/suivi-des-indicateurs/national"} collapsed />,
          linkProps: {
            href: "/admin/suivi-des-indicateurs/national",
            title: "National",
          },
          isActive: pathname === "/admin/suivi-des-indicateurs/national",
        },
        {
          text: <RegionsLabel isActive={isRegionPage} collapsed />,
          linkProps: {
            href: regionMenuHref,
            title: "Par région",
          },
          isActive: isRegionPage,
        },
        {
          text: <MissionLocaleLabel isActive={isMissionLocalePage || !!isMissionLocaleDetailPage} collapsed />,
          linkProps: {
            href: "/admin/suivi-des-indicateurs/mission-locale",
            title: "Par Mission Locale",
          },
          isActive: isMissionLocalePage || !!isMissionLocaleDetailPage,
        },
      ]
    : [
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
        {
          text: <MissionLocaleLabel isActive={isMissionLocalePage} />,
          linkProps: {
            href: "/admin/suivi-des-indicateurs/mission-locale",
          },
          isActive: isMissionLocalePage,
        },
      ];

  return (
    <>
      <div className={styles.bannerContainer}>
        <div className={styles.bannerContent}>
          <h1 className={styles.bannerTitle}>Suivi de l&lsquo;activité des Missions Locales sur le service</h1>
        </div>
      </div>

      <div className="fr-container fr-mt-2w fr-mb-3w">
        <DecaAlert />
      </div>

      <div className={styles.mainContainer}>
        <div className="fr-container">
          <div className="fr-grid-row">
            <div
              className={`fr-col-12 ${isCollapsedMenu ? "fr-col-md-1" : "fr-col-md-3"} ${styles.sideMenuColumn} ${isCollapsedMenu ? styles.sideMenuColumnCollapsed : ""}`}
            >
              <SideMenu
                align="left"
                burgerMenuButtonText="Dans cette rubrique"
                sticky={true}
                items={sideMenuItems}
                className={`${styles.sideMenuContainer} ${isCollapsedMenu ? styles.sideMenuCollapsed : ""}`}
              />
            </div>

            <div className={`fr-col-12 ${isCollapsedMenu ? "fr-col-md-11" : "fr-col-md-9"} ${styles.contentColumn}`}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
