"use client";

import type { SideMenuProps } from "@codegouvfr/react-dsfr/SideMenu";
import { usePathname } from "next/navigation";
import { REGIONS_BY_CODE } from "shared/constants/territoires";

import { useUserRegions } from "@/app/_components/statistiques/hooks/useUserRegions";
import {
  MissionLocaleLabel,
  NationalLabel,
  RegionItemLabel,
  RegionsLabel,
  SyntheseLabel,
} from "@/app/_components/statistiques/ui/MenuLabels";

import { StatistiquesLayoutBase } from "./StatistiquesLayoutBase";

const BASE_PATH = "/suivi-des-indicateurs";

export function StatistiquesMLLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const { regions: userRegions, isLoading } = useUserRegions();

  const isRegionPage = pathname.includes(`${BASE_PATH}/region/`) || pathname === `${BASE_PATH}/region`;
  const isMissionLocalePage = pathname === `${BASE_PATH}/mission-locale`;
  const isMissionLocaleDetailPage = pathname.match(new RegExp(`${BASE_PATH}/mission-locale/[^/]+$`));

  const currentRegionCode = isRegionPage ? pathname.split("/region/")[1]?.split("/")[0] : null;
  const isCollapsedMenu = !!isMissionLocaleDetailPage;

  const isMonoRegion = userRegions.length === 1;
  const hasRegions = userRegions.length > 0;
  const defaultRegionCode = userRegions[0];

  const regionMenuHref = isRegionPage
    ? pathname
    : isMonoRegion && defaultRegionCode
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
  } = params;

  const items: SideMenuProps.Item[] = [
    {
      text: <SyntheseLabel isActive={pathname === BASE_PATH} collapsed />,
      linkProps: { href: BASE_PATH, title: "Synthèse" },
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
        <RegionsLabel isActive={isRegionPage} collapsed regionCodes={userRegions} />
      ),
      linkProps: {
        href: regionMenuHref,
        title: isMonoRegion
          ? REGIONS_BY_CODE[defaultRegionCode as keyof typeof REGIONS_BY_CODE]?.nom || defaultRegionCode
          : "Mes régions",
      },
      isActive: isRegionPage,
    });
  }

  items.push({
    text: <MissionLocaleLabel isActive={isMissionLocalePage || isMissionLocaleDetailPage} collapsed />,
    linkProps: { href: `${BASE_PATH}/mission-locale`, title: "Par Mission Locale" },
    isActive: isMissionLocalePage || isMissionLocaleDetailPage,
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
        text: <RegionsLabel isActive={isRegionPage} regionCodes={userRegions} />,
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

  return items;
}
