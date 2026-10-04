"use client";

import type { SideMenuProps } from "@codegouvfr/react-dsfr/SideMenu";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useUserRegions } from "@/app/_components/statistiques/hooks/useUserRegions";
import {
  CfaLabel,
  MissionLocaleLabel,
  NationalLabel,
  RegionItemLabel,
  RegionsLabel,
  SyntheseLabel,
} from "@/app/_components/statistiques/ui/MenuLabels";
import { getRegionLabel } from "@/app/_components/statistiques/utils";

import { ADMIN_DEFAULT_REGION_CODE, ADMIN_REGION_CODES } from "./access";
import { StatistiquesLayoutBase } from "./StatistiquesLayoutBase";
import styles from "./StatistiquesMLLayoutClient.module.css";

const BASE_PATH = "/suivi-des-indicateurs";

interface StatistiquesMLLayoutClientProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  isDreets?: boolean;
}

export function StatistiquesMLLayoutClient({
  children,
  isAdmin = false,
  isDreets = false,
}: StatistiquesMLLayoutClientProps) {
  const pathname = usePathname() ?? "";
  const { regions: ownRegions, isLoading } = useUserRegions();
  const userRegions = isAdmin ? ADMIN_REGION_CODES : ownRegions;

  useEffect(() => {
    const reloadIfRestoredFromCache = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", reloadIfRestoredFromCache);
    return () => window.removeEventListener("pageshow", reloadIfRestoredFromCache);
  }, []);

  if (isDreets) {
    return (
      <div className={styles.dreetsPage}>
        <div className="fr-container">{children}</div>
      </div>
    );
  }

  const isRegionPage = pathname.includes(`${BASE_PATH}/region/`) || pathname === `${BASE_PATH}/region`;
  const isMissionLocalePage = pathname === `${BASE_PATH}/mission-locale`;
  const isMissionLocaleDetailPage = pathname.match(new RegExp(`${BASE_PATH}/mission-locale/[^/]+$`));

  const currentRegionCode = isRegionPage ? pathname.split("/region/")[1]?.split("/")[0] : null;
  const isCollapsedMenu = !!isMissionLocaleDetailPage;

  const isMonoRegion = userRegions.length === 1;
  const hasRegions = userRegions.length > 0;
  const defaultRegionCode = isAdmin ? ADMIN_DEFAULT_REGION_CODE : userRegions[0];
  const regionsLabel = isAdmin ? "Par région" : isMonoRegion ? "Ma région" : "Mes régions";

  const regionMenuHref = isRegionPage
    ? pathname
    : defaultRegionCode
      ? `${BASE_PATH}/region/${defaultRegionCode}`
      : `${BASE_PATH}/region`;

  const sideMenuItems = buildSideMenuItems({
    pathname,
    isCollapsedMenu,
    isRegionPage,
    isMissionLocalePage,
    isMissionLocaleDetailPage: !!isMissionLocaleDetailPage,
    currentRegionCode,
    userRegions,
    isMonoRegion,
    hasRegions,
    defaultRegionCode,
    regionMenuHref,
    regionsLabel,
  });

  return (
    <StatistiquesLayoutBase sideMenuItems={sideMenuItems} isCollapsed={isCollapsedMenu} isLoading={isLoading}>
      {children}
    </StatistiquesLayoutBase>
  );
}

interface BuildMenuParams {
  pathname: string;
  isCollapsedMenu: boolean;
  isRegionPage: boolean;
  isMissionLocalePage: boolean;
  isMissionLocaleDetailPage: boolean;
  currentRegionCode: string | null;
  userRegions: string[];
  isMonoRegion: boolean;
  hasRegions: boolean;
  defaultRegionCode: string | undefined;
  regionMenuHref: string;
  regionsLabel: string;
}

function buildSideMenuItems(params: BuildMenuParams): SideMenuProps.Item[] {
  const {
    pathname,
    isCollapsedMenu,
    isRegionPage,
    isMissionLocalePage,
    isMissionLocaleDetailPage,
    currentRegionCode,
    userRegions,
    isMonoRegion,
    hasRegions,
    defaultRegionCode,
    regionMenuHref,
    regionsLabel,
  } = params;

  if (isCollapsedMenu) {
    return buildCollapsedMenuItems({
      pathname,
      isRegionPage,
      isMissionLocalePage,
      isMissionLocaleDetailPage,
      userRegions,
      isMonoRegion,
      hasRegions,
      defaultRegionCode,
      regionMenuHref,
      regionsLabel,
    });
  }

  return buildExpandedMenuItems({
    pathname,
    isRegionPage,
    isMissionLocalePage,
    currentRegionCode,
    userRegions,
    isMonoRegion,
    hasRegions,
    defaultRegionCode,
    regionMenuHref,
    regionsLabel,
  });
}

function buildCollapsedMenuItems(
  params: Omit<BuildMenuParams, "isCollapsedMenu" | "currentRegionCode">
): SideMenuProps.Item[] {
  const {
    pathname,
    isRegionPage,
    isMissionLocalePage,
    isMissionLocaleDetailPage,
    userRegions,
    isMonoRegion,
    hasRegions,
    defaultRegionCode,
    regionMenuHref,
    regionsLabel,
  } = params;

  const items: SideMenuProps.Item[] = [
    {
      text: <SyntheseLabel isActive={pathname === BASE_PATH} collapsed />,
      linkProps: { href: BASE_PATH, title: "Vue d'ensemble" },
      isActive: pathname === BASE_PATH,
    },
    {
      text: <NationalLabel isActive={pathname === `${BASE_PATH}/national`} collapsed />,
      linkProps: { href: `${BASE_PATH}/national`, title: "National" },
      isActive: pathname === `${BASE_PATH}/national`,
    },
  ];

  if (hasRegions && defaultRegionCode) {
    items.push({
      text: isMonoRegion ? (
        <RegionItemLabel regionCode={defaultRegionCode} isActive={isRegionPage} collapsed />
      ) : (
        <RegionsLabel isActive={isRegionPage} collapsed regionCodes={userRegions} label={regionsLabel} />
      ),
      linkProps: {
        href: regionMenuHref,
        title: isMonoRegion ? getRegionLabel(defaultRegionCode) : regionsLabel,
      },
      isActive: isRegionPage,
    });
  }

  items.push({
    text: <MissionLocaleLabel isActive={isMissionLocalePage || isMissionLocaleDetailPage} collapsed />,
    linkProps: { href: `${BASE_PATH}/mission-locale`, title: "Par Mission Locale" },
    isActive: isMissionLocalePage || isMissionLocaleDetailPage,
  });

  items.push({
    text: <CfaLabel isActive={pathname.startsWith(`${BASE_PATH}/cfa`)} collapsed />,
    linkProps: { href: `${BASE_PATH}/cfa`, title: "Suivi CFA" },
    isActive: pathname.startsWith(`${BASE_PATH}/cfa`),
  });

  return items;
}

function buildExpandedMenuItems(
  params: Omit<BuildMenuParams, "isCollapsedMenu" | "isMissionLocaleDetailPage">
): SideMenuProps.Item[] {
  const {
    pathname,
    isRegionPage,
    isMissionLocalePage,
    currentRegionCode,
    userRegions,
    isMonoRegion,
    hasRegions,
    defaultRegionCode,
    regionMenuHref,
    regionsLabel,
  } = params;

  const items: SideMenuProps.Item[] = [
    {
      text: <SyntheseLabel isActive={pathname === BASE_PATH} />,
      linkProps: { href: BASE_PATH },
      isActive: pathname === BASE_PATH,
    },
    {
      text: <NationalLabel isActive={pathname === `${BASE_PATH}/national`} />,
      linkProps: { href: `${BASE_PATH}/national` },
      isActive: pathname === `${BASE_PATH}/national`,
    },
  ];

  if (hasRegions && defaultRegionCode) {
    if (isMonoRegion) {
      items.push({
        text: <RegionItemLabel regionCode={defaultRegionCode} isActive={isRegionPage} />,
        linkProps: { href: `${BASE_PATH}/region/${defaultRegionCode}` },
        isActive: isRegionPage,
      });
    } else {
      items.push({
        text: <RegionsLabel isActive={isRegionPage} regionCodes={userRegions} label={regionsLabel} />,
        linkProps: { href: regionMenuHref },
        isActive: isRegionPage,
        expandedByDefault: isRegionPage,
        items: userRegions.map((regionCode) => ({
          text: <RegionItemLabel regionCode={regionCode} isActive={currentRegionCode === regionCode} />,
          linkProps: { href: `${BASE_PATH}/region/${regionCode}` },
          isActive: currentRegionCode === regionCode,
        })),
      });
    }
  }

  items.push({
    text: <MissionLocaleLabel isActive={isMissionLocalePage} />,
    linkProps: { href: `${BASE_PATH}/mission-locale` },
    isActive: isMissionLocalePage,
  });

  items.push({
    text: <CfaLabel isActive={pathname.startsWith(`${BASE_PATH}/cfa`)} />,
    linkProps: { href: `${BASE_PATH}/cfa` },
    isActive: pathname.startsWith(`${BASE_PATH}/cfa`),
  });

  return items;
}
