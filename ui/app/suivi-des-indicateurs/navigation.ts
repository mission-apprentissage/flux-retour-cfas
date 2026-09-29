const BASE_PATH = "/suivi-des-indicateurs";

export const STATS_NAV_ITEMS = [
  { text: "Vue d'ensemble", href: BASE_PATH, isActive: (pathname: string) => pathname === BASE_PATH },
  {
    text: "Missions Locales et suivi des ruptures",
    href: `${BASE_PATH}/mission-locale`,
    isActive: (pathname: string) => pathname.startsWith(`${BASE_PATH}/mission-locale`),
  },
];
