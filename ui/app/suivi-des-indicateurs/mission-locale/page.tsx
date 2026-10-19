"use client";

import { Suspense } from "react";

import { AdoptionKpis } from "@/app/_components/statistiques/sections/AdoptionKpis";
import { CouvertureTerritoiresCard } from "@/app/_components/statistiques/sections/CouvertureTerritoiresCard";
import { MlRupturesAlertesSection } from "@/app/_components/statistiques/sections/MlAlertesSection";
import { OverviewSection } from "@/app/_components/statistiques/sections/OverviewSection";
import { SuiviTraitementMLCard } from "@/app/_components/statistiques/sections/SuiviTraitementMLCard";
import { TraitementRupturesPanel } from "@/app/_components/statistiques/sections/TraitementRupturesPanel";
import { SegmentAboutText } from "@/app/_components/statistiques/ui/SegmentAboutText";
import { StatsPageHeader } from "@/app/_components/statistiques/ui/StatsPageHeader";
import { StatsTabs } from "@/app/_components/statistiques/ui/StatsTabs";

export default function MissionLocalePage() {
  return (
    <Suspense>
      <MissionLocalePageContent />
    </Suspense>
  );
}

function MissionLocalePageContent() {
  return (
    <div>
      <StatsPageHeader
        title="Missions Locales et suivi des ruptures"
        description={
          <>
            Retrouvez ici les chiffres des indicateurs principaux du déploiement et de l&apos;activité des Missions
            Locales sur le Tableau de bord de l&apos;apprentissage sur le territoire de votre choix. Aussi retrouvez les
            chiffres sur le traitement et le suivi des dossiers de jeune en rupture uniquement.
            <br />
            Pour changer de territoire et de période sur la visualisation des données, rendez-vous dans l&apos;en-tête
            de cette page.
          </>
        }
      />
      <StatsTabs
        resetTableFilters
        tabs={[
          {
            id: "traitement",
            label: "Traitement et suivi des ruptures",
            iconId: "fr-icon-file-text-line",
            content: <TraitementRupturesPanel />,
          },
          {
            id: "deploiement",
            label: "Déploiement et activité des ML",
            iconId: "fr-icon-line-chart-line",
            content: <DeploiementActivitePanel />,
          },
        ]}
      />
    </div>
  );
}

function DeploiementActivitePanel() {
  return (
    <OverviewSection title="Déploiement et activité des Missions Locales">
      <SegmentAboutText variant="rupture" />
      <AdoptionKpis />
      <CouvertureTerritoiresCard />
      <SuiviTraitementMLCard />
      <MlRupturesAlertesSection />
    </OverviewSection>
  );
}
