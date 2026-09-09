"use client";

import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

import { useAuth } from "@/app/_context/UserContext";

const TABS = [
  { tabId: "apercu", label: "Aperçu", path: "" },
  { tabId: "effectifs", label: "Effectifs", path: "/effectifs" },
  { tabId: "transmissions", label: "Transmissions", path: "/transmissions" },
  { tabId: "organismes", label: "Ses organismes", path: "/organismes" },
] as const;

export type OrganismeTabId = (typeof TABS)[number]["tabId"];

export function OrganismeNavTabs({
  organismeId,
  activeTab,
  children,
}: {
  organismeId: string;
  activeTab: OrganismeTabId;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();

  if (user?.organisation?.type !== "ADMINISTRATEUR") return <>{children}</>;

  return (
    <Tabs
      selectedTabId={activeTab}
      tabs={TABS.map(({ tabId, label }) => ({ tabId, label }))}
      onTabChange={(tabId) => {
        const tab = TABS.find((entry) => entry.tabId === tabId);
        router.push(`/organismes/${organismeId}${tab?.path ?? ""}`);
      }}
    >
      {children}
    </Tabs>
  );
}
