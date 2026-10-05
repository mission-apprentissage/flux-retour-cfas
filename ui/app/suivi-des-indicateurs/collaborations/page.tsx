"use client";

import { Suspense } from "react";

import { CollabChiffresClesPanel } from "@/app/_components/statistiques/sections/CollabChiffresClesPanel";
import { StatsPageHeader } from "@/app/_components/statistiques/ui/StatsPageHeader";
import { StatsTabs } from "@/app/_components/statistiques/ui/StatsTabs";

export default function CollaborationsPage() {
  return (
    <Suspense>
      <StatsPageHeader
        title="Collaborations CFA et Missions Locales"
        description="Retrouvez ici les chiffres des indicateurs principaux du déploiement et de l'activité des Missions Locales et des CFA sur le Tableau de bord de l'apprentissage sur le territoire de votre choix."
      />
      <StatsTabs
        tabs={[
          {
            id: "chiffres-cles",
            label: "Chiffres clés",
            iconId: "fr-icon-file-text-line",
            content: <CollabChiffresClesPanel />,
          },
        ]}
      />
    </Suspense>
  );
}
