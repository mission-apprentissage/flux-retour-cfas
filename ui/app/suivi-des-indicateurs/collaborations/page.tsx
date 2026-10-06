"use client";

import { Suspense } from "react";
import { ORGANISATION_TYPE } from "shared/constants";

import { CollabActiviteCfaPanel } from "@/app/_components/statistiques/sections/CollabActiviteCfaPanel";
import { CollabActiviteMlPanel } from "@/app/_components/statistiques/sections/CollabActiviteMlPanel";
import { CollabChiffresClesPanel } from "@/app/_components/statistiques/sections/CollabChiffresClesPanel";
import { CollabListePanel } from "@/app/_components/statistiques/sections/CollabListePanel";
import { StatsPageHeader } from "@/app/_components/statistiques/ui/StatsPageHeader";
import { StatsTabs } from "@/app/_components/statistiques/ui/StatsTabs";
import { useAuth } from "@/app/_context/UserContext";

export default function CollaborationsPage() {
  const { user } = useAuth();
  // La liste nominative n'est pas ouverte aux ARML (le serveur la refuse aussi).
  const listeVisible = !!user && user.organisation?.type !== ORGANISATION_TYPE.ARML;

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
          {
            id: "activite-cfa",
            label: "Activité des CFA",
            iconId: "fr-icon-bar-chart-box-line",
            content: <CollabActiviteCfaPanel />,
          },
          {
            id: "activite-ml",
            label: "Activité des Missions Locales",
            iconId: "fr-icon-bar-chart-box-line",
            content: <CollabActiviteMlPanel />,
          },
          ...(listeVisible
            ? [
                {
                  id: "liste",
                  label: "Liste des collaborations",
                  iconId: "fr-icon-list-unordered" as const,
                  content: <CollabListePanel />,
                },
              ]
            : []),
        ]}
      />
    </Suspense>
  );
}
