"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, type ComponentType } from "react";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { PAGES } from "@/app/_utils/routes.utils";

import styles from "./referencement.module.scss";
import { AIDE_TABS, resolveTabSlug, type AideTabSlug } from "./tabs";
import AideCodeRncp from "./tabs/AideCodeRncp";
import AideNature from "./tabs/AideNature";
import AideQualiopi from "./tabs/AideQualiopi";
import AideRelationsOrganismes from "./tabs/AideRelationsOrganismes";
import AideSiret from "./tabs/AideSiret";
import AideUai from "./tabs/AideUai";
import { useAideTypeUser } from "./useAideTypeUser";

const TAB_CONTENT: Record<AideTabSlug, ComponentType> = {
  siret: AideSiret,
  uai: AideUai,
  nature: AideNature,
  "relations-entre-organismes": AideRelationsOrganismes,
  qualiopi: AideQualiopi,
  "code-rncp": AideCodeRncp,
};

export function ReferencementOrganismeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const typeUser = useAideTypeUser();

  const selectedTabId = resolveTabSlug(searchParams?.get("section"));
  const TabContent = TAB_CONTENT[selectedTabId];

  const handleTabChange = useCallback(
    (slug: string) => {
      const tab = AIDE_TABS.find((item) => item.slug === slug);
      if (!tab) return;

      trackPlausibleEvent(tab.goal, undefined, { type_user: typeUser });
      router.replace(`${PAGES.static.referencementOrganisme.getPath()}?section=${tab.slug}`, { scroll: false });
    },
    [router, trackPlausibleEvent, typeUser]
  );

  return (
    <main className={fr.cx("fr-container", "fr-py-6w")}>
      <h1 className={styles.title}>Comment bien référencer son établissement et ses formations ?</h1>

      <p className={styles.intro}>
        Les informations d’identification de votre établissement doivent être complètes et correctes pour transmettre
        vos effectifs au Tableau de bord de l’apprentissage. L’équipe du Tableau de bord ne peut pas les modifier
        directement. Voici les démarches que vous devez effectuer selon la donnée à modifier.
      </p>

      <Tabs
        className={styles.tabs}
        selectedTabId={selectedTabId}
        onTabChange={handleTabChange}
        tabs={AIDE_TABS.map(({ slug, label }) => ({ tabId: slug, label }))}
      >
        <TabContent />
      </Tabs>
    </main>
  );
}
