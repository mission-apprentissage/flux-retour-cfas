"use client";

import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, type ReactNode } from "react";

import { resolveTabId, type StatsTabDefinition } from "./StatsTabs.utils";

export interface StatsTab extends StatsTabDefinition {
  content: ReactNode;
}

interface StatsTabsProps {
  tabs: StatsTab[];
  className?: string;
}

const TAB_PARAM = "tab";

/**
 * Onglets DSFR contrôlés par `?tab=`. Un seul panneau est monté : l'état local des sections
 * (période, type de graphique) repart de zéro au changement d'onglet.
 */
export function StatsTabs({ tabs, className }: StatsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedTabId = resolveTabId(searchParams?.get(TAB_PARAM), tabs);
  const selectedTab = tabs.find((tab) => tab.id === selectedTabId);

  const handleTabChange = useCallback(
    (tabId: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      params.set(TAB_PARAM, tabId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  if (tabs.length === 0) {
    return null;
  }

  return (
    <Tabs
      className={className}
      selectedTabId={selectedTabId}
      onTabChange={handleTabChange}
      tabs={tabs.map(({ id, label }) => ({ tabId: id, label }))}
    >
      {selectedTab?.content}
    </Tabs>
  );
}
