"use client";

import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, type ReactNode } from "react";

import { STATS_FILTER_PARAMS } from "../hooks/useStatsFilters";

import styles from "./StatsTabs.module.css";
import { resolveTabId, type StatsTabDefinition } from "./StatsTabs.utils";

export interface StatsTab extends StatsTabDefinition {
  content: ReactNode;
}

interface StatsTabsProps {
  tabs: StatsTab[];
  className?: string;
  /** Ne garder que les filtres de l'en-tête au changement d'onglet (filtres de tableau propres à chaque onglet). */
  resetTableFilters?: boolean;
  /** Au changement d'onglet, ne garder que ces paramètres (les onglets embarquent des listes aux clés communes). */
  paramsConserves?: readonly string[];
}

const TAB_PARAM = "tab";

/**
 * Onglets DSFR contrôlés par `?tab=`. Un seul panneau est monté : l'état local des sections
 * (période, type de graphique) repart de zéro au changement d'onglet.
 */
export function StatsTabs({ tabs, className, resetTableFilters = false, paramsConserves }: StatsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedTabId = searchParams?.get(TAB_PARAM);
  const selectedTabId = resolveTabId(requestedTabId, tabs);
  const selectedTab = tabs.find((tab) => tab.id === selectedTabId);

  useEffect(() => {
    if (requestedTabId && requestedTabId !== selectedTabId) {
      const params = new URLSearchParams(searchParams?.toString());
      params.set(TAB_PARAM, selectedTabId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [requestedTabId, selectedTabId, router, pathname, searchParams]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      const reset = resetTableFilters || paramsConserves !== undefined;
      const params = new URLSearchParams(reset ? undefined : searchParams?.toString());
      if (reset) {
        [...(resetTableFilters ? STATS_FILTER_PARAMS : []), ...(paramsConserves ?? [])].forEach((key) => {
          const value = searchParams?.get(key);
          if (value) params.set(key, value);
        });
      }
      params.set(TAB_PARAM, tabId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, resetTableFilters, paramsConserves]
  );

  if (tabs.length === 0) {
    return null;
  }

  return (
    <Tabs
      className={`${styles.tabs} ${className ?? ""}`}
      selectedTabId={selectedTabId}
      onTabChange={handleTabChange}
      tabs={tabs.map(({ id, label, iconId }) => ({ tabId: id, label, iconId }))}
    >
      {selectedTab?.content}
    </Tabs>
  );
}
