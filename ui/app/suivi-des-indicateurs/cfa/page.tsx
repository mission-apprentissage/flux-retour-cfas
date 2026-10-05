"use client";

import { Suspense } from "react";

import { CfaAdoptionKpis } from "@/app/_components/statistiques/sections/CfaAdoptionKpis";
import { CfaEtablissementsCard } from "@/app/_components/statistiques/sections/CfaEtablissementsCard";
import { OverviewSection } from "@/app/_components/statistiques/sections/OverviewSection";
import { StatsPageHeader } from "@/app/_components/statistiques/ui/StatsPageHeader";

export default function SuiviCfaPage() {
  return (
    <Suspense>
      <StatsPageHeader
        title="Établissements de formation et CFA"
        description="Retrouvez ici les chiffres des indicateurs principaux du déploiement et de l'activité des Missions Locales et des CFA sur le Tableau de bord de l'apprentissage sur le territoire de votre choix."
      />
      <OverviewSection title="Déploiement et activité des CFA">
        <CfaAdoptionKpis />
        <CfaEtablissementsCard />
      </OverviewSection>
    </Suspense>
  );
}
