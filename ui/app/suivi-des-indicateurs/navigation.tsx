"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { buildStatsFiltersQuery } from "@/app/_components/statistiques/hooks/useStatsFilters";

const BASE_PATH = "/suivi-des-indicateurs";

export const STATS_NAV_ITEMS = [
  {
    text: "Vue d'ensemble",
    href: BASE_PATH,
    isActive: (pathname: string) =>
      pathname === BASE_PATH ||
      pathname.startsWith(`${BASE_PATH}/national`) ||
      pathname.startsWith(`${BASE_PATH}/region`),
  },
  {
    text: "Missions Locales et suivi des ruptures",
    href: `${BASE_PATH}/mission-locale`,
    isActive: (pathname: string) => pathname.startsWith(`${BASE_PATH}/mission-locale`),
  },
  {
    text: "Suivi CFA",
    href: `${BASE_PATH}/cfa`,
    isActive: (pathname: string) => pathname.startsWith(`${BASE_PATH}/cfa`),
  },
  {
    text: "Collaborations",
    href: `${BASE_PATH}/collaborations`,
    isActive: (pathname: string) => pathname.startsWith(`${BASE_PATH}/collaborations`),
  },
  {
    text: "Recherche",
    href: `${BASE_PATH}/recherche`,
    isActive: (pathname: string) => pathname.startsWith(`${BASE_PATH}/recherche`),
  },
];

/** À rendre sous un `Suspense` : lit les filtres de l'URL pour les reporter sur les onglets du header. */
export function StatsFiltersQueryReader({ onChange }: { onChange: (query: string) => void }) {
  const query = buildStatsFiltersQuery(useSearchParams());

  useEffect(() => {
    onChange(query);
  }, [query, onChange]);

  return null;
}
